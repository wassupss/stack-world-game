// ============================================================
// STACKWORLD - Edge Function: raid_command
// 레이드 상태 전이 + Realtime raid_events 브로드캐스트
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAX_CONCURRENT_RAIDS = 3;
const RATE_LIMIT_PER_SEC = 4;

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

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(characterId: string): boolean {
  const now = Date.now();
  const times = (rateLimitMap.get(characterId) ?? []).filter((t) => now - t < 1000);
  times.push(now);
  rateLimitMap.set(characterId, times);
  return times.length <= RATE_LIMIT_PER_SEC;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const { data: character } = await admin
    .from("characters")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!character) return json({ error: "캐릭터 없음" }, 404);

  if (!checkRateLimit(character.id)) {
    return json({ error: "레이드 커맨드 속도 제한 초과 (초당 4회)" }, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "잘못된 JSON" }, 400);
  }

  const parsed = RaidCommandSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "입력값 오류", details: parsed.error.flatten() }, 400);
  }

  const input = parsed.data;

  // Idempotency
  const { data: existing } = await admin
    .from("raid_commands")
    .select("id, result")
    .eq("idempotency_key", input.idempotency_key)
    .single();
  if (existing) return json({ ok: true, cached: true, result: existing.result });

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
    return json({ error: "서버 오류" }, 500);
  }
});

// ──────────── join ────────────
async function handleJoin(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "join" }>,
) {
  // 파티 멤버 검증
  const { data: member } = await db
    .from("party_members")
    .select("party_id")
    .eq("party_id", input.party_id)
    .eq("character_id", character.id)
    .single();
  if (!member) return json({ error: "해당 파티의 멤버가 아닙니다" }, 403);

  // 진행 중인 솔로 런이 있으면 거부
  const { data: activeRun } = await db
    .from("runs")
    .select("id")
    .eq("character_id", character.id)
    .eq("status", "active")
    .single();
  if (activeRun) {
    return json({ error: "솔로 런이 진행 중입니다. 먼저 런을 종료하세요. (run end)" }, 400);
  }

  // 동시 레이드 개수 제한
  const { count } = await db
    .from("raids")
    .select("id", { count: "exact", head: true })
    .in("status", ["waiting", "active"]);
  if ((count ?? 0) >= MAX_CONCURRENT_RAIDS) {
    return json({ error: `동시 레이드는 최대 ${MAX_CONCURRENT_RAIDS}개입니다` }, 429);
  }

  // 시나리오 조회
  const { data: scenario } = await db
    .from("raid_scenarios")
    .select("time_limit_sec, initial_kpi, actions")
    .eq("scenario_key", input.scenario_key)
    .single();
  if (!scenario) return json({ error: "레이드 시나리오를 찾을 수 없습니다" }, 404);

  // 파티에 기존 대기 레이드 있는지 확인
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

  // 파티 멤버 수 확인 (solo면 1명으로 즉시 시작, 아니면 3명 이상이면 자동 시작)
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

    // Realtime: 레이드 시작 이벤트 브로드캐스트
    await broadcastRaidEvent(db, raidId, "raid_start", {
      scenario_key: input.scenario_key,
      party_id: input.party_id,
      solo: input.solo,
    }, character.id);
  }

  // 액션 목록 (label/description/kpi_effect만 추출)
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

  return json({ ok: true, result });
}

// ──────────── action ────────────
async function handleAction(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "action" }>,
) {
  const { data: raid } = await db
    .from("raids")
    .select("*, raid_scenarios(actions, events)")
    .eq("id", input.raid_id)
    .eq("status", "active")
    .single();

  if (!raid) return json({ error: "활성 레이드를 찾을 수 없습니다" }, 404);

  // 파티 멤버 검증
  const isMember = await db
    .from("party_members")
    .select("party_id")
    .eq("party_id", raid.party_id)
    .eq("character_id", character.id)
    .single();
  if (!isMember.data) return json({ error: "레이드 파티 멤버가 아닙니다" }, 403);

  const now = Date.now();

  // 레이드 시간 초과 체크
  if (raid.started_at) {
    const elapsed = (now - new Date(raid.started_at).getTime()) / 1000;
    if (elapsed > raid.time_limit_sec) {
      await db.from("raids").update({ status: "failed", ended_at: new Date().toISOString() })
        .eq("id", input.raid_id);
      await broadcastRaidEvent(db, input.raid_id, "raid_timeout", { elapsed }, character.id);
      return json({ error: "레이드 시간 초과" }, 400);
    }
  }

  // 시나리오 액션/이벤트 정의
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
  if (!actionDef) return json({ error: `알 수 없는 액션: ${input.action_key}` }, 400);

  const actionLabel = actionDef.label ?? input.action_key;

  // ── 쿨다운 체크 (_cooldowns: { action_key -> expires_at_ms }) ──
  const currentKPIRaw = raid.kpi as Record<string, unknown>;
  const cooldownMap = (currentKPIRaw._cooldowns ?? {}) as Record<string, number>;
  const appliedEvents = (currentKPIRaw._applied_events ?? []) as string[];

  const cooldownMs = (actionDef.cooldown_sec ?? 0) * 1000;
  const expiresAt = cooldownMap[input.action_key] ?? 0;
  if (cooldownMs > 0 && now < expiresAt) {
    const remaining = Math.ceil((expiresAt - now) / 1000);
    return json({ error: `[${actionLabel}] 쿨다운 중 (${remaining}초 후 사용 가능)` }, 400);
  }

  // 포지션 숙련 기반 효율 계산
  const { data: masteries } = await db
    .from("position_mastery")
    .select("position, level")
    .eq("character_id", character.id);

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

  // ── 판정 롤 (0 ~ 1) ──
  // 0.00~0.08: 역효과(backfire)  0.09~0.84: 일반 성공  0.85~1.00: 치명적 성공
  const roll = Math.random();
  const CRIT_THRESHOLD  = 0.85;
  const BACK_THRESHOLD  = 0.08;
  const isCritical = roll >= CRIT_THRESHOLD;
  const isBackfire = roll <= BACK_THRESHOLD;

  // ── 콤보 감지 (_last_action_key 기반) ──
  const lastActionKey = (currentKPIRaw._last_action_key ?? "") as string;
  const COMBOS: Record<string, string[]> = {
    trace:      ["patch", "circuit_break", "cache_bust", "rollback", "canary"],
    scale:      ["rollback", "canary", "circuit_break"],
    quarantine: ["circuit_break", "patch"],
    alert_tune: ["patch", "canary", "rollback"],
  };
  const isCombo = !!(COMBOS[lastActionKey]?.includes(input.action_key));
  const comboMult = isCombo ? 1.3 : 1.0;

  // ── 최종 효율 계산 ──
  // normal: 기본 효율 × bonusMult × (roll 기반 0.8~1.0 스케일) × combo
  // critical: 기본 효율 × bonusMult × 2.0 × combo
  // backfire: 역방향 30% 강도 (KPI 악화)
  const normalScale = 0.8 + roll * 0.24; // roll 0.08~0.84 → scale 0.82~1.00
  const effectMult = isCritical
    ? bonusMult * 2.0 * comboMult
    : isBackfire
    ? 0 // backfire는 별도 처리
    : bonusMult * normalScale * comboMult;

  // KPI 갱신 — 액션 효과 적용
  const kpiEffect = actionDef.kpi_effect ?? {};
  const newKPI: Record<string, unknown> = { ...currentKPIRaw };

  if (isBackfire) {
    // 역효과: 30% 강도로 KPI 악화
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

  // 쿨다운 만료 시각 업데이트 + 마지막 액션 추적
  newKPI._cooldowns = { ...cooldownMap, [input.action_key]: now + cooldownMs };
  newKPI._last_action_key = input.action_key;

  // ── 타임드 이벤트 적용 ──
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

  // KPI 값 범위 클램프
  if (typeof newKPI.error_rate   === "number") newKPI.error_rate   = Math.max(0,   Math.min(100, newKPI.error_rate));
  if (typeof newKPI.success_rate === "number") newKPI.success_rate = Math.max(0,   Math.min(100, newKPI.success_rate));
  if (typeof newKPI.latency_p95  === "number") newKPI.latency_p95  = Math.max(0,   newKPI.latency_p95);
  if (typeof newKPI.deploy_health === "number") newKPI.deploy_health = Math.max(0, Math.min(100, newKPI.deploy_health));

  await db.from("raids").update({ kpi: newKPI }).eq("id", input.raid_id);

  // Realtime 브로드캐스트
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

  // 승리 조건 체크
  const targetErrorRate  = (currentKPIRaw.target_error_rate  as number) ?? 5;
  const targetSuccessRate = (currentKPIRaw.target_success_rate as number) ?? 95;
  const isVictory =
    (newKPI.error_rate  as number) <= targetErrorRate &&
    (newKPI.success_rate as number) >= targetSuccessRate;

  let victoryCredits = 0;
  if (isVictory) {
    await db.from("raids").update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", input.raid_id);

    // 파티 멤버 전원에게 KPI 기반 보상 지급
    const { data: partyMembers } = await db
      .from("party_members")
      .select("character_id")
      .eq("party_id", raid.party_id);

    if (partyMembers && partyMembers.length > 0) {
      // KPI 점수: error_rate 낮을수록 + success_rate 높을수록 유리 (0~100 스케일)
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

  // 다음 액션 목록 (쿨다운 정보 포함)
  const updatedCooldownMap = newKPI._cooldowns as Record<string, number>;
  const nextActions = isVictory ? [] : actions.map((a) => {
    const aExpiresAt = updatedCooldownMap[a.action_key] ?? 0;
    const aCooldownMs = (a.cooldown_sec ?? 0) * 1000;
    const remainingSec = Math.max(0, Math.ceil((aExpiresAt - Date.now()) / 1000));
    return {
      action_key: a.action_key,
      label: a.label ?? a.action_key,
      description: a.description ?? "",
      kpi_effect: a.kpi_effect ?? {},
      position_bonus: a.position_bonus ?? {},
      cooldown_sec: a.cooldown_sec ?? 0,
      cooldown_remaining: remainingSec,
      is_ready: aCooldownMs === 0 || remainingSec === 0,
    };
  });

  const comboSuffix   = isCombo    ? " 🔗 콤보!" : "";
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

  await db.from("raid_commands").insert({
    raid_id: input.raid_id,
    character_id: character.id,
    action_key: input.action_key,
    args: input.args,
    result,
    idempotency_key: input.idempotency_key,
  });

  return json({ ok: true, result });
}

// ──────────── resolve ────────────
async function handleResolve(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "resolve" }>,
) {
  const { data: raid } = await db
    .from("raids")
    .select("*, parties(leader_id)")
    .eq("id", input.raid_id)
    .single();

  if (!raid) return json({ error: "레이드를 찾을 수 없습니다" }, 404);

  // 파티 리더만 강제 종료 가능
  if (raid.parties?.leader_id !== character.id) {
    return json({ error: "파티 리더만 레이드를 강제 종료할 수 있습니다" }, 403);
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

  return json({ ok: true, result });
}

// ──────────── abandon ────────────
async function handleAbandon(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "abandon" }>,
) {
  const { data: raid } = await db
    .from("raids")
    .select("id, party_id, status")
    .eq("id", input.raid_id)
    .single();

  if (!raid) return json({ error: "레이드를 찾을 수 없습니다" }, 404);

  // 파티 멤버인지 확인
  const { data: member } = await db
    .from("party_members")
    .select("character_id")
    .eq("party_id", raid.party_id)
    .eq("character_id", character.id)
    .single();

  if (!member) return json({ error: "레이드 파티 멤버가 아닙니다" }, 403);

  // 이미 종료된 상태면 그냥 통과
  if (raid.status === "completed" || raid.status === "failed") {
    return json({ ok: true, result: { message: "레이드가 이미 종료되었습니다" } });
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

  return json({ ok: true, result });
}

// ──────────── chat ────────────
async function handleChat(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<z.infer<typeof RaidCommandSchema>, { action: "chat" }>,
) {
  // 레이드 확인 (대기 또는 진행 중)
  const { data: raid } = await db
    .from("raids")
    .select("party_id")
    .eq("id", input.raid_id)
    .in("status", ["waiting", "active"])
    .single();
  if (!raid) return json({ error: "활성 레이드를 찾을 수 없습니다" }, 404);

  // 파티 멤버 검증 + 캐릭터 이름 조회
  const { data: member } = await db
    .from("party_members")
    .select("characters(name)")
    .eq("party_id", raid.party_id)
    .eq("character_id", character.id)
    .single();
  if (!member) return json({ error: "파티 멤버가 아닙니다" }, 403);

  const charName = (member.characters as { name: string } | null)?.name ?? "???";

  // raid_events 에 삽입 → Realtime이 구독자에게 브로드캐스트
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

  return json({ ok: true });
}

// ──────────── Realtime 브로드캐스트 ────────────
async function broadcastRaidEvent(
  db: ReturnType<typeof createClient>,
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
