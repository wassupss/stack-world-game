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
    .select("time_limit_sec, initial_kpi")
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

  const result = {
    raid_id: raidId,
    status: shouldStart ? "active" : "waiting",
    members: memberCount,
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
    .select("*, raid_scenarios(actions)")
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

  // 레이드 시간 초과 체크
  if (raid.started_at) {
    const elapsed = (Date.now() - new Date(raid.started_at).getTime()) / 1000;
    if (elapsed > raid.time_limit_sec) {
      await db.from("raids").update({ status: "failed", ended_at: new Date().toISOString() })
        .eq("id", input.raid_id);
      await broadcastRaidEvent(db, input.raid_id, "raid_timeout", { elapsed }, character.id);
      return json({ error: "레이드 시간 초과" }, 400);
    }
  }

  // 시나리오 액션 정의 찾기
  const actions = (raid.raid_scenarios?.actions ?? []) as Array<{
    action_key: string;
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

  const actionDef = actions.find((a) => a.action_key === input.action_key);
  if (!actionDef) return json({ error: `알 수 없는 액션: ${input.action_key}` }, 400);

  // 포지션 숙련 기반 효율 계산
  const { data: masteries } = await db
    .from("position_mastery")
    .select("position, level")
    .eq("character_id", character.id);

  const masteryMap = Object.fromEntries(
    (masteries ?? []).map((m: { position: string; level: number }) => [m.position, m.level]),
  );

  // 최고 포지션 보너스 적용
  let bonusMult = 1.0;
  for (const [pos, mult] of Object.entries(actionDef.position_bonus)) {
    const level = masteryMap[pos] ?? 1;
    if (level > 0) {
      bonusMult = Math.max(bonusMult, mult * (1 + level * 0.01));
    }
  }

  // KPI 갱신
  const currentKPI = raid.kpi as Record<string, number>;
  const kpiEffect = actionDef.kpi_effect ?? {};
  const newKPI = { ...currentKPI };

  if (kpiEffect.error_rate_reduce) {
    newKPI.error_rate = Math.max(0, currentKPI.error_rate - kpiEffect.error_rate_reduce * bonusMult);
  }
  if (kpiEffect.success_rate_add) {
    newKPI.success_rate = Math.min(100, currentKPI.success_rate + kpiEffect.success_rate_add * bonusMult);
  }
  if (kpiEffect.latency_reduce) {
    newKPI.latency_p95 = Math.max(0, currentKPI.latency_p95 - kpiEffect.latency_reduce * bonusMult);
  }
  if (kpiEffect.deploy_health_add) {
    newKPI.deploy_health = Math.min(100, (currentKPI.deploy_health ?? 0) + kpiEffect.deploy_health_add * bonusMult);
  }

  await db.from("raids").update({ kpi: newKPI }).eq("id", input.raid_id);

  // Realtime 브로드캐스트
  await broadcastRaidEvent(db, input.raid_id, "action_result", {
    action_key: input.action_key,
    actor_name: character.id,
    kpi_before: currentKPI,
    kpi_after: newKPI,
    bonus_mult: bonusMult.toFixed(2),
  }, character.id);

  // 승리 조건 체크
  const target = currentKPI as { target_error_rate: number; target_success_rate: number };
  const isVictory =
    newKPI.error_rate <= (target.target_error_rate ?? 5) &&
    newKPI.success_rate >= (target.target_success_rate ?? 95);

  if (isVictory) {
    await db.from("raids").update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", input.raid_id);
    await broadcastRaidEvent(db, input.raid_id, "raid_victory", { kpi: newKPI }, character.id);
  }

  const result = {
    action_key: input.action_key,
    bonus_mult: bonusMult.toFixed(2),
    kpi: newKPI,
    victory: isVictory,
    message: `[${input.action_key}] 실행 완료 (보너스 x${bonusMult.toFixed(2)})`,
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
