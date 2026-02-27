// ============================================================
// STACKWORLD - API Route: /api/raid-command
// 레이드 상태 전이 + Realtime raid_events 브로드캐스트 (Edge Function 직접 이식)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type DB = ReturnType<typeof createAdminClient>;

const MAX_CONCURRENT_RAIDS = 3;

const RaidCommandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("join"),
    party_id: z.string().uuid(),
    scenario_key: z.string().min(1),
    mode: z.enum(["incident", "launch"]),
    tier: z.number().int().min(1).max(5).default(1),
    solo: z.boolean().optional().default(false),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("action"),
    raid_id: z.string().uuid(),
    action_key: z.string().min(1),
    args: z.record(z.unknown()).default({}),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("chat"),
    raid_id: z.string().uuid(),
    message: z.string().min(1).max(200),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("resolve"),
    raid_id: z.string().uuid(),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("abandon"),
    raid_id: z.string().uuid(),
    idempotency_key: z.string().min(1).max(128),
  }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: character } = await admin
    .from("characters")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!character) return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON" }, { status: 400 });
  }

  const parsed = RaidCommandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값 오류", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  // Idempotency
  const { data: existing } = await admin
    .from("raid_commands")
    .select("id, result")
    .eq("idempotency_key", input.idempotency_key)
    .single();
  if (existing) return NextResponse.json({ ok: true, cached: true, result: existing.result });

  try {
    switch (input.action) {
      case "join":
        return await handleJoin(admin, character, input);
      case "action":
        return await handleAction(admin, character, input);
      case "chat":
        return await handleChat(admin, character, input);
      case "resolve":
        return await handleResolve(admin, character, input);
      case "abandon":
        return await handleAbandon(admin, character, input);
    }
  } catch (e) {
    console.error("raid_command error:", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

// ──────────── join ────────────
async function handleJoin(
  db: DB,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "join" }>,
) {
  const { data: member } = await db
    .from("party_members")
    .select("party_id")
    .eq("party_id", input.party_id)
    .eq("character_id", character.id)
    .single();
  if (!member) return NextResponse.json({ error: "해당 파티의 멤버가 아닙니다" }, { status: 403 });

  const { data: activeRun } = await db
    .from("runs")
    .select("id")
    .eq("character_id", character.id)
    .eq("status", "active")
    .single();
  if (activeRun) {
    return NextResponse.json({ error: "솔로 런이 진행 중입니다. 먼저 런을 종료하세요. (run end)" }, { status: 400 });
  }

  const { count } = await db
    .from("raids")
    .select("id", { count: "exact", head: true })
    .in("status", ["waiting", "active"]);
  if ((count ?? 0) >= MAX_CONCURRENT_RAIDS) {
    return NextResponse.json({ error: `동시 레이드는 최대 ${MAX_CONCURRENT_RAIDS}개입니다` }, { status: 429 });
  }

  const { data: scenario } = await db
    .from("raid_scenarios")
    .select("time_limit_sec, initial_kpi, actions")
    .eq("scenario_key", input.scenario_key)
    .single();
  if (!scenario) return NextResponse.json({ error: "레이드 시나리오를 찾을 수 없습니다" }, { status: 404 });

  const { data: existingRaid } = await db
    .from("raids")
    .select("id")
    .eq("party_id", input.party_id)
    .eq("status", "waiting")
    .single();

  let raidId: string;
  if (existingRaid) {
    raidId = existingRaid.id;
  } else {
    const { data: newRaid, error } = await db
      .from("raids")
      .insert({
        party_id: input.party_id,
        scenario_key: input.scenario_key,
        mode: input.mode,
        tier: input.tier,
        status: "waiting",
        kpi: scenario.initial_kpi,
        time_limit_sec: scenario.time_limit_sec,
      })
      .select("id")
      .single();
    if (error) throw error;
    raidId = newRaid.id;
  }

  const { count: memberCount } = await db
    .from("party_members")
    .select("*", { count: "exact", head: true })
    .eq("party_id", input.party_id);

  const shouldStart = input.solo || (memberCount ?? 0) >= 3;

  if (shouldStart) {
    await db.from("raids").update({
      status: "active",
      started_at: new Date().toISOString(),
    }).eq("id", raidId);

    await broadcastRaidEvent(db, raidId, "raid_start", {
      scenario_key: input.scenario_key,
      party_id: input.party_id,
      solo: input.solo,
    }, character.id);
  }

  const availableActions = ((scenario?.actions ?? []) as Array<{
    action_key: string; label?: string; description?: string;
    kpi_effect?: Record<string, number>; position_bonus?: Record<string, number>;
  }>).map((a) => ({
    action_key: a.action_key,
    label: a.label ?? a.action_key,
    description: a.description ?? "",
    kpi_effect: a.kpi_effect ?? {},
    position_bonus: a.position_bonus ?? {},
  }));

  const result = {
    raid_id: raidId,
    status: shouldStart ? "active" : "waiting",
    members: memberCount,
    available_actions: availableActions,
    message: shouldStart
      ? input.solo
        ? "솔로 레이드 시작! 혼자서도 할 수 있어!"
        : "레이드 시작! 모든 파티원 집합!"
      : `레이드 대기 중 (${memberCount}/3명)`,
  };

  await db.from("raid_commands").insert({
    raid_id: raidId,
    character_id: character.id,
    action_key: "join",
    args: input,
    result,
    idempotency_key: input.idempotency_key,
  });

  return NextResponse.json({ ok: true, result });
}

// ──────────── action ────────────
async function handleAction(
  db: DB,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "action" }>,
) {
  const { data: raid } = await db
    .from("raids")
    .select("*, raid_scenarios(actions, events)")
    .eq("id", input.raid_id)
    .eq("status", "active")
    .single();

  if (!raid) return NextResponse.json({ error: "활성 레이드를 찾을 수 없습니다" }, { status: 404 });

  const now = Date.now();

  // isMember + masteries 병렬 조회 (둘 다 raid.party_id / character.id에만 의존)
  const [isMemberRes, masteriesRes] = await Promise.all([
    db.from("party_members")
      .select("party_id")
      .eq("party_id", raid.party_id)
      .eq("character_id", character.id)
      .single(),
    db.from("position_mastery")
      .select("position, level")
      .eq("character_id", character.id),
  ]);

  if (!isMemberRes.data) return NextResponse.json({ error: "레이드 파티 멤버가 아닙니다" }, { status: 403 });

  if (raid.started_at) {
    const elapsed = (now - new Date(raid.started_at).getTime()) / 1000;
    if (elapsed > raid.time_limit_sec) {
      await db.from("raids").update({ status: "failed", ended_at: new Date().toISOString() })
        .eq("id", input.raid_id);
      await broadcastRaidEvent(db, input.raid_id, "raid_timeout", { elapsed }, character.id);
      return NextResponse.json({ error: "레이드 시간 초과" }, { status: 400 });
    }
  }

  const actions = (raid.raid_scenarios?.actions ?? []) as Array<{
    action_key: string;
    label?: string;
    description?: string;
    kpi_effect: {
      error_rate_reduce?: number;
      success_rate_add?: number;
      latency_reduce?: number;
      deploy_health_add?: number;
    };
    position_bonus: Record<string, number>;
    time_cost_sec: number;
    cooldown_sec: number;
    required_position_level?: Record<string, number>;
  }>;

  const scenarioEvents = (raid.raid_scenarios?.events ?? []) as Array<{
    at_sec: number;
    event_key: string;
    title: string;
    description: string;
    severity: number;
    kpi_delta: Record<string, number>;
  }>;

  const actionDef = actions.find((a) => a.action_key === input.action_key);
  if (!actionDef) return NextResponse.json({ error: `알 수 없는 액션: ${input.action_key}` }, { status: 400 });

  const actionLabel = actionDef.label ?? input.action_key;

  const currentKPIRaw = raid.kpi as Record<string, unknown>;
  const cooldownMap = (currentKPIRaw._cooldowns ?? {}) as Record<string, number>;
  const appliedEvents = (currentKPIRaw._applied_events ?? []) as string[];

  const cooldownMs = (actionDef.cooldown_sec ?? 0) * 1000;
  const expiresAt = cooldownMap[input.action_key] ?? 0;
  if (cooldownMs > 0 && now < expiresAt) {
    const remaining = Math.ceil((expiresAt - now) / 1000);
    return NextResponse.json({ error: `[${actionLabel}] 쿨다운 중 (${remaining}초 후 사용 가능)` }, { status: 400 });
  }

  const masteries = masteriesRes.data;

  const masteryMap = Object.fromEntries(
    (masteries ?? []).map((m: { position: string; level: number }) => [m.position, m.level]),
  );

  let bonusMult = 1.0;
  for (const [pos, mult] of Object.entries(actionDef.position_bonus)) {
    const level = masteryMap[pos] ?? 1;
    if (level > 0) {
      bonusMult = Math.max(bonusMult, mult * (1 + level * 0.01));
    }
  }

  const ACTION_RISK_PROFILES: Record<string, { crit: number; back: number }> = {
    trace:         { crit: 0.20, back: 0.03 },
    alert_tune:    { crit: 0.18, back: 0.04 },
    cache_bust:    { crit: 0.18, back: 0.06 },
    canary:        { crit: 0.12, back: 0.05 },
    quarantine:    { crit: 0.15, back: 0.08 },
    circuit_break: { crit: 0.15, back: 0.08 },
    scale:         { crit: 0.15, back: 0.10 },
    patch:         { crit: 0.25, back: 0.12 },
    rollback:      { crit: 0.20, back: 0.15 },
  };

  const roll = Math.random();
  const profile = ACTION_RISK_PROFILES[input.action_key] ?? { crit: 0.15, back: 0.08 };
  const isCritical = roll >= (1 - profile.crit);
  const isBackfire = roll <= profile.back;

  const lastActionKey = (currentKPIRaw._last_action_key ?? "") as string;
  const COMBOS: Record<string, string[]> = {
    trace:      ["patch", "circuit_break", "cache_bust", "rollback", "canary"],
    scale:      ["rollback", "canary", "circuit_break"],
    quarantine: ["circuit_break", "patch"],
    alert_tune: ["patch", "canary", "rollback"],
  };
  const isCombo = !!(COMBOS[lastActionKey]?.includes(input.action_key));
  const comboMult = isCombo ? 1.3 : 1.0;

  const normalScale = 0.8 + roll * 0.24;
  const effectMult = isCritical
    ? bonusMult * 2.0 * comboMult
    : isBackfire
    ? 0
    : bonusMult * normalScale * comboMult;

  const kpiEffect = actionDef.kpi_effect ?? {};
  const newKPI: Record<string, unknown> = { ...currentKPIRaw };

  if (isBackfire) {
    if (kpiEffect.error_rate_reduce)  newKPI.error_rate   = Math.min(100, (currentKPIRaw.error_rate   as number) + kpiEffect.error_rate_reduce  * 0.3);
    if (kpiEffect.success_rate_add)   newKPI.success_rate = Math.max(0,   (currentKPIRaw.success_rate as number) - kpiEffect.success_rate_add   * 0.3);
    if (kpiEffect.latency_reduce)     newKPI.latency_p95  = Math.min(9999,(currentKPIRaw.latency_p95  as number) + kpiEffect.latency_reduce     * 0.3);
    if (kpiEffect.deploy_health_add)  newKPI.deploy_health = Math.max(0, ((currentKPIRaw.deploy_health ?? 0) as number) - kpiEffect.deploy_health_add * 0.3);
  } else {
    if (kpiEffect.error_rate_reduce)  newKPI.error_rate   = Math.max(0,   (currentKPIRaw.error_rate   as number) - kpiEffect.error_rate_reduce  * effectMult);
    if (kpiEffect.success_rate_add)   newKPI.success_rate = Math.min(100, (currentKPIRaw.success_rate as number) + kpiEffect.success_rate_add   * effectMult);
    if (kpiEffect.latency_reduce)     newKPI.latency_p95  = Math.max(0,   (currentKPIRaw.latency_p95  as number) - kpiEffect.latency_reduce     * effectMult);
    if (kpiEffect.deploy_health_add)  newKPI.deploy_health = Math.min(100,((currentKPIRaw.deploy_health ?? 0) as number) + kpiEffect.deploy_health_add * effectMult);
  }

  newKPI._cooldowns = { ...cooldownMap, [input.action_key]: now + cooldownMs };
  newKPI._last_action_key = input.action_key;

  const elapsedSec = raid.started_at
    ? (now - new Date(raid.started_at).getTime()) / 1000
    : 0;

  const newAppliedEvents = [...appliedEvents];
  const newlyFiredEvents: Array<{ title: string; description: string; severity: number }> = [];

  for (const evt of scenarioEvents) {
    if (evt.at_sec <= elapsedSec && !newAppliedEvents.includes(evt.event_key)) {
      newAppliedEvents.push(evt.event_key);
      newlyFiredEvents.push({ title: evt.title, description: evt.description, severity: evt.severity });
      for (const [key, delta] of Object.entries(evt.kpi_delta)) {
        if (typeof delta === "number" && typeof newKPI[key] === "number") {
          newKPI[key] = (newKPI[key] as number) + delta;
        }
      }
    }
  }
  newKPI._applied_events = newAppliedEvents;

  if (typeof newKPI.error_rate   === "number") newKPI.error_rate   = Math.max(0,   Math.min(100, newKPI.error_rate));
  if (typeof newKPI.success_rate === "number") newKPI.success_rate = Math.max(0,   Math.min(100, newKPI.success_rate));
  if (typeof newKPI.latency_p95  === "number") newKPI.latency_p95  = Math.max(0,   newKPI.latency_p95);
  if (typeof newKPI.deploy_health === "number") newKPI.deploy_health = Math.max(0, Math.min(100, newKPI.deploy_health));

  await db.from("raids").update({ kpi: newKPI }).eq("id", input.raid_id);

  await broadcastRaidEvent(db, input.raid_id, "action_result", {
    action_key: input.action_key,
    actor_name: character.id,
    kpi_after: newKPI,
    roll: roll.toFixed(3),
    is_critical: isCritical,
    is_backfire: isBackfire,
    is_combo: isCombo,
    newly_fired_events: newlyFiredEvents,
  }, character.id);

  const targetErrorRate  = (currentKPIRaw.target_error_rate  as number) ?? 5;
  const targetSuccessRate = (currentKPIRaw.target_success_rate as number) ?? 95;
  const isVictory =
    (newKPI.error_rate  as number) <= targetErrorRate &&
    (newKPI.success_rate as number) >= targetSuccessRate;

  let victoryCredits = 0;
  if (isVictory) {
    await db.from("raids").update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", input.raid_id);

    const { data: partyMembers } = await db
      .from("party_members")
      .select("character_id")
      .eq("party_id", raid.party_id);

    if (partyMembers && partyMembers.length > 0) {
      const errorBonus   = Math.max(0, 100 - (newKPI.error_rate   as number ?? 100));
      const successBonus = newKPI.success_rate as number ?? 0;
      const kpiScore     = (errorBonus + successBonus) / 2;
      victoryCredits     = Math.max(80, Math.floor(kpiScore * 0.8) + raid.tier * 40);

      for (const pm of partyMembers) {
        await db.rpc("grant_credits", { p_character_id: pm.character_id, p_amount: victoryCredits });
      }
    }

    await broadcastRaidEvent(db, input.raid_id, "raid_victory", {
      kpi: newKPI,
      victory_credits: victoryCredits,
    }, character.id);
  }

  const updatedCooldownMap = newKPI._cooldowns as Record<string, number>;
  const nextActions = isVictory ? [] : actions.map((a) => {
    const aExpiresAt = updatedCooldownMap[a.action_key] ?? 0;
    const aCooldownMs = (a.cooldown_sec ?? 0) * 1000;
    const remainingSec = Math.max(0, Math.ceil((aExpiresAt - Date.now()) / 1000));
    const aProfile = ACTION_RISK_PROFILES[a.action_key] ?? { crit: 0.15, back: 0.08 };
    return {
      action_key: a.action_key,
      label: a.label ?? a.action_key,
      description: a.description ?? "",
      kpi_effect: a.kpi_effect ?? {},
      position_bonus: a.position_bonus ?? {},
      cooldown_sec: a.cooldown_sec ?? 0,
      cooldown_remaining: remainingSec,
      is_ready: aCooldownMs === 0 || remainingSec === 0,
      crit_chance: aProfile.crit,
      back_chance: aProfile.back,
    };
  });

  const comboSuffix   = isCombo    ? " 콤보!" : "";
  const outcomeLabel  = isCritical ? `치명적 성공! [${actionLabel}]` : isBackfire ? `역효과 발생! [${actionLabel}]` : `[${actionLabel}] 실행 완료`;
  const effDisplay    = isCritical ? `x${(bonusMult * 2.0 * comboMult).toFixed(2)}` : isBackfire ? "역방향 x0.30" : `x${effectMult.toFixed(2)}`;

  const result = {
    action_key: input.action_key,
    action_label: actionLabel,
    roll: roll,
    is_critical: isCritical,
    is_backfire: isBackfire,
    is_combo: isCombo,
    bonus_mult: bonusMult.toFixed(2),
    kpi: newKPI,
    victory: isVictory,
    victory_credits: isVictory ? victoryCredits : null,
    available_actions: nextActions,
    newly_fired_events: newlyFiredEvents,
    message: `${outcomeLabel} (효율 ${effDisplay})${comboSuffix}`,
  };

  // 로깅 fire-and-forget
  void db.from("raid_commands").insert({
    raid_id: input.raid_id,
    character_id: character.id,
    action_key: input.action_key,
    args: input.args,
    result,
    idempotency_key: input.idempotency_key,
  });

  return NextResponse.json({ ok: true, result });
}

// ──────────── resolve ────────────
async function handleResolve(
  db: DB,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "resolve" }>,
) {
  const { data: raid } = await db
    .from("raids")
    .select("*, parties(leader_id)")
    .eq("id", input.raid_id)
    .single();

  if (!raid) return NextResponse.json({ error: "레이드를 찾을 수 없습니다" }, { status: 404 });

  if (raid.parties?.leader_id !== character.id) {
    return NextResponse.json({ error: "파티 리더만 레이드를 강제 종료할 수 있습니다" }, { status: 403 });
  }

  const status = raid.status === "active" ? "failed" : raid.status;
  await db.from("raids").update({ status, ended_at: new Date().toISOString() })
    .eq("id", input.raid_id);

  await broadcastRaidEvent(db, input.raid_id, "raid_resolved", { forced: true }, character.id);

  const result = { raid_id: input.raid_id, status, message: "레이드 강제 종료" };

  await db.from("raid_commands").insert({
    raid_id: input.raid_id,
    character_id: character.id,
    action_key: "resolve",
    args: {},
    result,
    idempotency_key: input.idempotency_key,
  });

  return NextResponse.json({ ok: true, result });
}

// ──────────── abandon ────────────
async function handleAbandon(
  db: DB,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "abandon" }>,
) {
  const { data: raid } = await db
    .from("raids")
    .select("id, party_id, status")
    .eq("id", input.raid_id)
    .single();

  if (!raid) return NextResponse.json({ error: "레이드를 찾을 수 없습니다" }, { status: 404 });

  const { data: member } = await db
    .from("party_members")
    .select("character_id")
    .eq("party_id", raid.party_id)
    .eq("character_id", character.id)
    .single();

  if (!member) return NextResponse.json({ error: "레이드 파티 멤버가 아닙니다" }, { status: 403 });

  if (raid.status === "completed" || raid.status === "failed") {
    return NextResponse.json({ ok: true, result: { message: "레이드가 이미 종료되었습니다" } });
  }

  await db
    .from("raids")
    .update({ status: "failed", ended_at: new Date().toISOString() })
    .eq("id", input.raid_id);

  await broadcastRaidEvent(db, input.raid_id, "raid_abandoned", { actor_id: character.id }, character.id);

  const result = { raid_id: input.raid_id, message: "레이드를 포기했습니다" };

  await db.from("raid_commands").insert({
    raid_id: input.raid_id,
    character_id: character.id,
    action_key: "abandon",
    args: {},
    result,
    idempotency_key: input.idempotency_key,
  });

  return NextResponse.json({ ok: true, result });
}

// ──────────── chat ────────────
async function handleChat(
  db: DB,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "chat" }>,
) {
  const { data: raid } = await db
    .from("raids")
    .select("party_id")
    .eq("id", input.raid_id)
    .in("status", ["waiting", "active"])
    .single();
  if (!raid) return NextResponse.json({ error: "활성 레이드를 찾을 수 없습니다" }, { status: 404 });

  const { data: member } = await db
    .from("party_members")
    .select("characters(name)")
    .eq("party_id", raid.party_id)
    .eq("character_id", character.id)
    .single();
  if (!member) return NextResponse.json({ error: "파티 멤버가 아닙니다" }, { status: 403 });

  const charName = (member.characters as unknown as { name: string } | null)?.name ?? "???";

  await db.from("raid_events").insert({
    raid_id: input.raid_id,
    type: "raid_chat",
    payload: {
      character_id: character.id,
      character_name: charName,
      message: input.message,
    },
    actor_id: character.id,
  });

  return NextResponse.json({ ok: true });
}

// ──────────── Realtime 브로드캐스트 ────────────
async function broadcastRaidEvent(
  db: DB,
  raidId: string,
  type: string,
  payload: Record<string, unknown>,
  actorId: string,
) {
  await db.from("raid_events").insert({
    raid_id: raidId,
    type,
    payload,
    actor_id: actorId,
  });
}
