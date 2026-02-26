// ============================================================
// STACKWORLD - Edge Function: run_command
// 솔로 런 상태 전이 권위 함수
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ──────────── 환경변수 ────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ──────────── 상수 ────────────
const RATE_LIMIT_PER_SEC = 4;
const MAX_RISK = 100;
const MAX_DEBT = 50;

// ──────────── Zod 스키마 ────────────
const RunCommandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    tier: z.number().int().min(1).max(5).default(1),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("event"),
    run_id: z.string().uuid(),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("choose"),
    run_id: z.string().uuid(),
    choice_index: z.number().int().min(0).max(3),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("work"),
    run_id: z.string().uuid(),
    ticket_key: z.string().min(1),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("craft"),
    run_id: z.string().uuid(),
    artifact_key: z.string().min(1),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("end"),
    run_id: z.string().uuid(),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("draw"),
    run_id: z.string().uuid(),
    idempotency_key: z.string().min(1).max(128),
  }),
]);

type RunCommandInput = z.infer<typeof RunCommandSchema>;

// ──────────── Status Effect 타입 ────────────
type StatusEffectType = "flow_state" | "tired" | "focused" | "guaranteed_critical" | "risk_shield" | "success_boost";

interface ActiveEffect {
  type: StatusEffectType;
  magnitude: number;
  turns_left: number;
}

interface IncidentPenalty {
  time_delta: number;
  risk_delta: number;
  message: string;
}

// ──────────── Seed 기반 RNG ────────────
function seededRng(seed: string, salt: string): () => number {
  let hash = 0;
  const str = seed + salt;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return () => {
    hash = ((hash << 5) - hash + 1) | 0;
    return Math.abs(hash) / 2147483648;
  };
}

// ──────────── 레벨 → XP 임계값 ────────────
function xpForLevel(level: number): number {
  const softCap = 30;
  if (level < softCap) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }
  return Math.floor((100 * Math.pow(1.5, softCap - 1)) / 0.7);
}

// ──────────── 숙련 효율 계산 ────────────
function calcMasteryBonus(
  positionLevel: number,
  coreLevel: number,
  baseCost: number,
): { timeMult: number; successBonus: number; qualityBonus: number } {
  const timeMult = Math.max(0.5, 1.0 - positionLevel * 0.02);
  const successBonus = positionLevel * 0.01 + coreLevel * 0.005;
  const qualityBonus = positionLevel * 0.5;
  return { timeMult, successBonus, qualityBonus };
}

// ──────────── Rate Limit 검사 ────────────
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(characterId: string): boolean {
  const now = Date.now();
  const window = 1000; // 1초
  const times = rateLimitMap.get(characterId) ?? [];
  const recent = times.filter((t) => now - t < window);
  recent.push(now);
  rateLimitMap.set(characterId, recent);
  return recent.length <= RATE_LIMIT_PER_SEC;
}

// ──────────── 메인 핸들러 ────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  // JWT 검증 및 유저 파악
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  // 캐릭터 조회
  const { data: character } = await adminClient
    .from("characters")
    .select("id, credits, queued_modifier")
    .eq("user_id", user.id)
    .single();
  if (!character) return json({ error: "캐릭터가 없습니다" }, 404);

  // Rate Limit 검사
  if (!checkRateLimit(character.id)) {
    return json({ error: "커맨드를 너무 빠르게 입력하고 있습니다 (초당 4회 제한)" }, 429);
  }

  // 입력 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "잘못된 JSON 형식" }, 400);
  }

  const parsed = RunCommandSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "입력값 오류", details: parsed.error.flatten() }, 400);
  }

  const input = parsed.data;

  // Idempotency 검사
  const { data: existing } = await adminClient
    .from("run_commands")
    .select("id, result")
    .eq("idempotency_key", input.idempotency_key)
    .single();
  if (existing) {
    return json({ ok: true, cached: true, result: existing.result });
  }

  try {
    switch (input.action) {
      case "start":
        return await handleStart(adminClient, character, input);
      case "event":
        return await handleEvent(adminClient, character, input);
      case "choose":
        return await handleChoose(adminClient, character, input);
      case "work":
        return await handleWork(adminClient, character, input);
      case "craft":
        return await handleCraft(adminClient, character, input);
      case "end":
        return await handleEnd(adminClient, character, input);
      case "draw":
        return await handleDraw(adminClient, character, input);
    }
  } catch (e) {
    console.error("run_command error:", e);
    return json({ error: "서버 오류" }, 500);
  }
});

// ──────────── Action: start ────────────
async function handleStart(
  db: ReturnType<typeof createClient>,
  character: { id: string; credits: number; queued_modifier?: string | null },
  input: Extract<RunCommandInput, { action: "start" }>,
) {
  // 진행 중인 런이 있으면 거부
  const { data: activeRun } = await db
    .from("runs")
    .select("id")
    .eq("character_id", character.id)
    .eq("status", "active")
    .single();
  if (activeRun) {
    return json({ error: "이미 진행 중인 런이 있습니다. 먼저 종료하세요." }, 400);
  }

  // 진행 중인 레이드가 있으면 거부
  const { data: activeMembership } = await db
    .from("party_members")
    .select("party_id")
    .eq("character_id", character.id)
    .single();
  if (activeMembership) {
    const { data: activeRaid } = await db
      .from("raids")
      .select("id")
      .eq("party_id", activeMembership.party_id)
      .in("status", ["waiting", "active"])
      .single();
    if (activeRaid) {
      return json({ error: "레이드가 진행 중입니다. 먼저 레이드를 완료하거나 탈퇴하세요." }, 400);
    }
  }

  // seed 생성 (유저 기반 + 타임스탬프)
  const seed = `${character.id}-${Date.now()}`;

  // 현재 시즌 조회
  const { data: season } = await db
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .single();

  // 영구 업그레이드 조회 (starting_quality_bonus)
  const { data: upgrades } = await db
    .from("character_upgrades")
    .select("item_key, level")
    .eq("character_id", character.id);

  // 업그레이드 키 목록에서 shop_items 조회
  const upgradeKeys = (upgrades ?? []).map((u: { item_key: string }) => u.item_key);
  let startingQualityBonus = 0;
  let startingTimeBonus = 0;
  let startingRiskReduction = 0;
  if (upgradeKeys.length > 0) {
    const { data: shopItems } = await db
      .from("shop_items")
      .select("item_key, effect_data")
      .in("item_key", upgradeKeys);
    const itemMap = Object.fromEntries(
      (shopItems ?? []).map((i: { item_key: string; effect_data: Record<string, unknown> }) => [i.item_key, i.effect_data])
    );
    for (const u of upgrades ?? []) {
      const effect = itemMap[u.item_key] ?? {};
      const lv = u.level as number;
      if (effect.starting_quality_bonus) startingQualityBonus += (effect.starting_quality_bonus as number) * lv;
      if (effect.starting_time_bonus)    startingTimeBonus    += (effect.starting_time_bonus    as number) * lv;
      if (effect.starting_risk_reduction) startingRiskReduction += (effect.starting_risk_reduction as number) * lv;
    }
  }

  // 수식어 효과 계산
  let modifierEffects: Record<string, unknown> = {};
  const queuedModifier = character.queued_modifier ?? null;
  if (queuedModifier) {
    const { data: modItem } = await db
      .from("shop_items")
      .select("effect_data")
      .eq("item_key", queuedModifier)
      .single();
    if (modItem) modifierEffects = modItem.effect_data as Record<string, unknown>;

    // 수식어 수량 차감
    const { data: modCharItem } = await db
      .from("character_items")
      .select("qty")
      .eq("character_id", character.id)
      .eq("item_key", queuedModifier)
      .single();
    if (modCharItem && modCharItem.qty > 0) {
      await db.from("character_items").update({ qty: modCharItem.qty - 1 })
        .eq("character_id", character.id).eq("item_key", queuedModifier);
    }
    // queued_modifier 해제
    await db.from("characters").update({ queued_modifier: null }).eq("id", character.id);
  }

  // 초기 자원 계산 (장비 보너스 반영)
  const initialQuality = Math.min(100, 50 + startingQualityBonus);
  const initialTime    = Math.min(120, 100 + startingTimeBonus);   // 최대 120 (모니터 3레벨 = +24)
  const initialRisk    = Math.max(0,   10  - startingRiskReduction);

  const { data: run, error } = await db
    .from("runs")
    .insert({
      character_id: character.id,
      season_id: season?.id ?? null,
      tier: input.tier,
      seed,
      status: "active",
      phase: "plan",
      time: initialTime,
      risk: initialRisk,
      debt: 0,
      quality: initialQuality,
      active_modifier: queuedModifier,
    })
    .select()
    .single();

  if (error) throw error;

  const resources = { time: initialTime, risk: initialRisk, debt: 0, quality: initialQuality };
  const modNote = queuedModifier ? `  [${queuedModifier} 적용]` : "";
  const result = {
    run_id: run.id,
    seed,
    phase: "plan",
    resources,
    message: `런 시작! [Tier ${input.tier}] seed: ${seed.slice(-8)}${modNote}`,
  };

  await logCommand(db, character.id, run.id, "start", input, result, input.idempotency_key);
  return json({ ok: true, result });
}

// ──────────── Action: event ────────────
async function handleEvent(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<RunCommandInput, { action: "event" }>,
) {
  const run = await getActiveRun(db, character.id, input.run_id);
  if (!run) return json({ error: "활성 런을 찾을 수 없습니다" }, 404);

  // 현재 페이즈의 이벤트 목록 조회
  const { data: events } = await db
    .from("events")
    .select("event_key, title, description, severity, choices")
    .eq("phase", run.phase);

  if (!events || events.length === 0) {
    return json({ error: "이벤트가 없습니다" }, 404);
  }

  // seed 기반 RNG로 이벤트 선택
  const rng = seededRng(run.seed, `event-${run.cmd_count}`);
  const eventIdx = Math.floor(rng() * events.length);
  const selectedEvent = events[eventIdx];

  // run_events에 기록
  await db.from("run_events").insert({
    run_id: run.id,
    event_key: selectedEvent.event_key,
    phase: run.phase,
    result: {},
  });

  const result = {
    event_key: selectedEvent.event_key,
    title: selectedEvent.title,
    description: selectedEvent.description,
    severity: selectedEvent.severity,
    choices: selectedEvent.choices,
    message: `[이벤트] ${selectedEvent.title} (심각도 ${selectedEvent.severity})`,
  };

  await logCommand(db, character.id, run.id, "event", input, result, input.idempotency_key);
  await incrementCmdCount(db, run.id);
  return json({ ok: true, result });
}

// ──────────── 확률 선택지 타입 ────────────
type OutcomeType = "success" | "partial" | "fail";

interface ChoiceOutcome {
  type: OutcomeType;
  label: string;
  time_delta: number;
  risk_delta: number;
  debt_delta: number;
  quality_delta: number;
  prob: number;
}

interface ProbabilisticChoice {
  label: string;
  description: string;
  risk_level: string;
  outcomes: ChoiceOutcome[];
}

// ──────────── Action: choose ────────────
async function handleChoose(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<RunCommandInput, { action: "choose" }>,
) {
  const run = await getActiveRun(db, character.id, input.run_id);
  if (!run) return json({ error: "활성 런을 찾을 수 없습니다" }, 404);

  // 가장 최근 이벤트 조회
  const { data: lastEvent } = await db
    .from("run_events")
    .select("id, event_key, choice_index")
    .eq("run_id", run.id)
    .is("choice_index", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastEvent) return json({ error: "처리할 이벤트가 없습니다" }, 400);

  // 이벤트 데이터 조회
  const { data: eventData } = await db
    .from("events")
    .select("choices")
    .eq("event_key", lastEvent.event_key)
    .single();

  if (!eventData || !Array.isArray(eventData.choices)) {
    return json({ error: "이벤트 데이터 오류" }, 500);
  }

  const choices = eventData.choices as ProbabilisticChoice[];

  if (input.choice_index >= choices.length) {
    return json({ error: `선택지는 0~${choices.length - 1}만 가능합니다` }, 400);
  }

  const choice = choices[input.choice_index];

  // ── 확률 기반 outcome 롤 ──
  const rng = seededRng(run.seed, `choose-${run.cmd_count}-${lastEvent.id.slice(0, 8)}`);
  const roll = rng();

  let outcomeType: OutcomeType = "fail";
  let cumulative = 0;
  for (const o of choice.outcomes) {
    cumulative += o.prob ?? 0;
    if (roll <= cumulative) {
      outcomeType = o.type;
      break;
    }
  }
  const outcome = choice.outcomes.find((o) => o.type === outcomeType) ?? choice.outcomes[choice.outcomes.length - 1];

  // 자원 갱신
  const newTime = Math.max(0, run.time + outcome.time_delta);
  const newRisk = Math.min(MAX_RISK, Math.max(0, run.risk + outcome.risk_delta));
  const newDebt = Math.min(MAX_DEBT, Math.max(0, run.debt + outcome.debt_delta));
  const newQuality = Math.min(100, Math.max(0, run.quality + outcome.quality_delta));

  await db.from("runs").update({
    time: newTime,
    risk: newRisk,
    debt: newDebt,
    quality: newQuality,
  }).eq("id", run.id);

  // 이벤트 처리 완료 마킹 (outcome_type 포함 저장)
  const eventResult = {
    choice_label: choice.label,
    risk_level: choice.risk_level,
    outcome_type: outcomeType,
    outcome_label: outcome.label,
    roll: roll.toFixed(3),
    delta: {
      time: outcome.time_delta,
      risk: outcome.risk_delta,
      debt: outcome.debt_delta,
      quality: outcome.quality_delta,
    },
  };
  await db.from("run_events").update({ choice_index: input.choice_index, result: eventResult })
    .eq("id", lastEvent.id);

  // 런 실패 체크
  if (newTime <= 0 || newRisk >= MAX_RISK) {
    await db.from("runs").update({ status: "failed", ended_at: new Date().toISOString() })
      .eq("id", run.id);
  }

  // roll_data: AnimatedRollEntry 재활용
  const successProb = choice.outcomes.find((o) => o.type === "success")?.prob ?? 0.5;
  const roll_data = {
    roll,
    threshold: successProb,
    isCritical: outcomeType === "success" && choice.risk_level === "gamble",
    isFumble: outcomeType === "fail",
    isSuccess: outcomeType !== "fail",
  };

  const result = {
    choice: choice.label,
    risk_level: choice.risk_level,
    outcome_type: outcomeType,
    outcome_label: outcome.label,
    delta: {
      time: outcome.time_delta,
      risk: outcome.risk_delta,
      debt: outcome.debt_delta,
      quality: outcome.quality_delta,
    },
    resources: { time: newTime, risk: newRisk, debt: newDebt, quality: newQuality },
    roll_data,
    message: `[선택] ${choice.label} → ${outcome.label}`,
  };

  await logCommand(db, character.id, run.id, "choose", input, result, input.idempotency_key);
  await incrementCmdCount(db, run.id);
  return json({ ok: true, result });
}

// ──────────── System 2: RISK 위기 사고 판정 ────────────
function computeIncident(risk: number, rngValue: number): IncidentPenalty | null {
  let threshold = 0;
  let penalty: IncidentPenalty;

  if (risk >= 90) {
    threshold = 0.20;
    penalty = { time_delta: -10, risk_delta: 15, message: "치명적 장애 발생! 전 팀 비상 대응 (TIME-10 RISK+15)" };
  } else if (risk >= 70) {
    threshold = 0.08;
    penalty = { time_delta: -5, risk_delta: 8, message: "장애 사고 발생 (TIME-5 RISK+8)" };
  } else if (risk >= 50) {
    threshold = 0.03;
    penalty = { time_delta: -3, risk_delta: 5, message: "경미한 서버 사고 (TIME-3 RISK+5)" };
  } else {
    return null;
  }

  return rngValue < threshold ? penalty : null;
}

// ──────────── System 3: 상태 효과 적용 ────────────
function applyEffectsToThresholds(
  activeEffects: ActiveEffect[],
  base: { successThreshold: number; criticalThreshold: number; fumbleThreshold: number },
): { successThreshold: number; criticalThreshold: number; fumbleThreshold: number } {
  let { successThreshold, criticalThreshold, fumbleThreshold } = base;
  for (const ef of activeEffects) {
    if (ef.type === "flow_state" || ef.type === "success_boost") {
      // flow_state/success_boost: 성공 임계값 낮춤 (더 쉽게 성공)
      successThreshold = Math.max(0.1, successThreshold - ef.magnitude);
    }
    if (ef.type === "tired") {
      fumbleThreshold = Math.min(0.40, fumbleThreshold + ef.magnitude);
    }
  }
  return { successThreshold, criticalThreshold, fumbleThreshold };
}

function tickEffects(effects: ActiveEffect[]): ActiveEffect[] {
  return effects
    .map((e) => ({ ...e, turns_left: e.turns_left - 1 }))
    .filter((e) => e.turns_left > 0);
}

function computeNewEffects(
  isCritical: boolean,
  isFumble: boolean,
  newStreak: number,
): ActiveEffect[] {
  const effects: ActiveEffect[] = [];
  if (isCritical) {
    effects.push({ type: "flow_state", magnitude: 0.15, turns_left: 3 });
  }
  if (isFumble) {
    effects.push({ type: "tired", magnitude: 0.05, turns_left: 2 });
  }
  if (newStreak === 5) {
    effects.push({ type: "focused", magnitude: 5, turns_left: 3 });
  }
  if (newStreak >= 10 && (newStreak - 10) % 5 === 0) {
    effects.push({ type: "guaranteed_critical", magnitude: 0, turns_left: 1 });
  }
  return effects;
}

function computeStreakXpMult(streak: number): number {
  if (streak >= 5) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

function scaleRewardXP(
  rewardXP: { position?: Record<string, number>; core?: Record<string, number> },
  mult: number,
): { position?: Record<string, number>; core?: Record<string, number> } {
  if (mult <= 1.0 || !rewardXP) return rewardXP;
  const scaled: typeof rewardXP = {};
  if (rewardXP.position) {
    scaled.position = Object.fromEntries(
      Object.entries(rewardXP.position).map(([k, v]) => [k, Math.ceil(v * mult)]),
    );
  }
  if (rewardXP.core) {
    scaled.core = Object.fromEntries(
      Object.entries(rewardXP.core).map(([k, v]) => [k, Math.ceil(v * mult)]),
    );
  }
  return scaled;
}

// ──────────── Action: work (ticket) ────────────
async function handleWork(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<RunCommandInput, { action: "work" }>,
) {
  const run = await getActiveRun(db, character.id, input.run_id);
  if (!run) return json({ error: "활성 런을 찾을 수 없습니다" }, 404);

  // 티켓 조회
  const { data: ticket } = await db
    .from("tickets")
    .select("*")
    .eq("ticket_key", input.ticket_key)
    .eq("phase", run.phase)
    .single();

  if (!ticket) {
    return json({ error: `티켓 ${input.ticket_key}을 현재 페이즈(${run.phase})에서 찾을 수 없습니다` }, 404);
  }

  // 포지션 숙련 조회
  const { data: mastery } = await db
    .from("position_mastery")
    .select("position, level")
    .eq("character_id", character.id)
    .eq("position", ticket.position_tag)
    .single();

  const { data: coreMastery } = await db
    .from("core_mastery")
    .select("core, level")
    .eq("character_id", character.id)
    .eq("core", "problem_solving")
    .single();

  const posLevel = mastery?.level ?? 1;
  const coreLevel = coreMastery?.level ?? 1;
  const bonus = calcMasteryBonus(posLevel, coreLevel, ticket.base_time_cost);

  // ── 영구 업그레이드 효과 계산 ──
  const { data: charUpgrades } = await db
    .from("character_upgrades")
    .select("item_key, level")
    .eq("character_id", character.id);

  let upgCritDelta = 0;
  let upgFumbleDelta = 0;
  let upgTimeCostReduction = 0;
  let upgIncidentProbMult = 1.0;
  let upgXpBonus = 0;
  let upgQualityRegenPerWork = 0;   // EQUIP_HEADPHONES
  let upgTimeBonusPerWork = 0;      // EQUIP_COFFEE_SETUP
  let upgSuccessThresholdDelta = 0; // EQUIP_MECH_KEYBOARD

  if ((charUpgrades ?? []).length > 0) {
    const upgradeKeys = (charUpgrades ?? []).map((u: { item_key: string }) => u.item_key);
    const { data: shopItems } = await db
      .from("shop_items").select("item_key, effect_data").in("item_key", upgradeKeys);
    const shopMap = Object.fromEntries(
      (shopItems ?? []).map((i: { item_key: string; effect_data: Record<string, unknown> }) => [i.item_key, i.effect_data])
    );
    for (const u of charUpgrades ?? []) {
      const ef = shopMap[u.item_key] ?? {};
      const lv = u.level as number;
      if (ef.crit_threshold_delta) upgCritDelta += (ef.crit_threshold_delta as number) * lv;
      if (ef.fumble_threshold_delta) upgFumbleDelta += (ef.fumble_threshold_delta as number) * lv;
      if (ef.time_cost_reduction) upgTimeCostReduction += (ef.time_cost_reduction as number) * lv;
      if (ef.incident_prob_multiplier) upgIncidentProbMult *= Math.pow(ef.incident_prob_multiplier as number, lv);
      if (ef.xp_multiplier_bonus) upgXpBonus += (ef.xp_multiplier_bonus as number) * lv;
      if (ef.quality_regen_per_work) upgQualityRegenPerWork += (ef.quality_regen_per_work as number) * lv;
      if (ef.time_bonus_per_work) upgTimeBonusPerWork += (ef.time_bonus_per_work as number) * lv;
      if (ef.success_threshold_delta) upgSuccessThresholdDelta += (ef.success_threshold_delta as number) * lv;
    }
  }

  // ── 활성 수식어 효과 계산 ──
  let modCritDelta = 0;
  let modFumbleDelta = 0;
  let modSuccessDelta = 0;
  let modTimeCostMult = 1.0;
  let modXpMult = 1.0;
  if (run.active_modifier) {
    const { data: modItem } = await db
      .from("shop_items").select("effect_data").eq("item_key", run.active_modifier).single();
    if (modItem) {
      const ef = modItem.effect_data as Record<string, unknown>;
      if (ef.crit_threshold_delta) modCritDelta = ef.crit_threshold_delta as number;
      if (ef.fumble_threshold_delta) modFumbleDelta = ef.fumble_threshold_delta as number;
      if (ef.success_threshold_delta) modSuccessDelta = ef.success_threshold_delta as number;
      if (ef.time_cost_multiplier) modTimeCostMult = ef.time_cost_multiplier as number;
      if (ef.xp_multiplier) modXpMult = ef.xp_multiplier as number;
    }
  }

  // ── System 3: 활성 효과 로드 ──
  const activeEffects: ActiveEffect[] = Array.isArray(run.active_effects)
    ? (run.active_effects as ActiveEffect[])
    : [];
  const hasGuaranteedCritical = activeEffects.some((e) => e.type === "guaranteed_critical");
  const hasRiskShield = activeEffects.some((e) => e.type === "risk_shield");

  // ── 위기 상태 판정 (임계값 계산 전에 미리) ──
  const debtPressure = run.debt >= 30;    // 기술 부채 압박: TIME 추가 소모
  const qualityCrisis = run.quality < 20; // 품질 위기: 성공률 하락

  // ── 임계값 계산 (effects + streak + 업그레이드 + 수식어 + 위기 반영) ──
  const baseCriticalThreshold = run.current_streak >= 5 ? 0.90 : 0.95;
  const qualityCrisisPenalty = qualityCrisis ? 0.05 : 0; // 품질 위기: 성공률 -5%
  const thresholds = applyEffectsToThresholds(activeEffects, {
    successThreshold: Math.max(0.1, 0.7 + bonus.successBonus + modSuccessDelta + upgSuccessThresholdDelta + qualityCrisisPenalty),
    criticalThreshold: Math.max(0.5, baseCriticalThreshold + upgCritDelta + modCritDelta),
    fumbleThreshold: Math.max(0, 0.05 + upgFumbleDelta + modFumbleDelta),
  });

  // ── RNG 판정 ──
  const rng = seededRng(run.seed, `work-${run.cmd_count}-${input.ticket_key}`);
  const roll = rng();

  const isCritical = hasGuaranteedCritical ? true : roll > thresholds.criticalThreshold;
  const isFumble = hasGuaranteedCritical ? false : roll < thresholds.fumbleThreshold;
  const isSuccess = isCritical ? true : isFumble ? false : roll < thresholds.successThreshold;

  // ── System 2: RISK 위기 사고 (risk_shield로 차단 가능) ──
  const incidentRng = seededRng(run.seed, `incident-${run.cmd_count}`);
  const rawIncident = hasRiskShield ? null : computeIncident(run.risk, incidentRng() * upgIncidentProbMult);
  const incident = rawIncident;

  // ── 기본 자원 변화 ──
  let timeCost = Math.max(1, Math.ceil(ticket.base_time_cost * bonus.timeMult * modTimeCostMult) - upgTimeCostReduction);
  let riskDelta = isSuccess ? ticket.base_risk_delta : ticket.base_risk_delta + 2;
  let qualityDelta = isSuccess
    ? ticket.base_quality_delta + bonus.qualityBonus
    : ticket.base_quality_delta - 1;
  let debtDelta = 0;

  // 부채 압박: DEBT >= 30 → 시간 추가 소모
  if (debtPressure) timeCost += 2;

  // Critical/Fumble 추가 효과
  if (isCritical) {
    timeCost = Math.max(0, timeCost - 3);
    riskDelta -= 2;
    qualityDelta += 5;
    debtDelta -= 1; // 치명타: 부채 소폭 감소 (깔끔한 코드)
  } else if (isFumble) {
    timeCost += 5;
    riskDelta += 5;
    qualityDelta -= 3;
    debtDelta += 2; // 실수: 기술 부채 증가 (임시방편)
  } else if (!isSuccess) {
    debtDelta += 1; // 일반 실패: 부채 소폭 증가
  }

  // ── System 4: 포지션 시너지 ──
  const prevPositionStreak = run.position_streak ?? 0;
  const prevPositionStreakTag = run.position_streak_tag ?? null;
  let newPositionStreak = 0;
  let newPositionStreakTag: string | null = null;
  let positionSynergyBonus = 0;
  let positionSynergyMessage: string | null = null;

  if (isSuccess) {
    if (ticket.position_tag === prevPositionStreakTag) {
      newPositionStreak = prevPositionStreak + 1;
    } else {
      newPositionStreak = 1;
    }
    newPositionStreakTag = ticket.position_tag;

    if (newPositionStreak >= 5) {
      positionSynergyBonus = 10;
      positionSynergyMessage = `[${ticket.position_tag} 시너지 x5] 품질 +10 ★★★`;
    } else if (newPositionStreak >= 3) {
      positionSynergyBonus = 5;
      positionSynergyMessage = `[${ticket.position_tag} 시너지 x3] 품질 +5 ★★`;
    } else if (newPositionStreak >= 2) {
      positionSynergyBonus = 2;
      positionSynergyMessage = `[${ticket.position_tag} 시너지 x2] 품질 +2 ★`;
    }
    qualityDelta += positionSynergyBonus;
  }

  // focused 효과: 성공 시 quality 추가 보너스
  if (isSuccess) {
    for (const ef of activeEffects) {
      if (ef.type === "focused") qualityDelta += ef.magnitude;
    }
    // 장비 보너스: 헤드폰 quality 재생
    if (upgQualityRegenPerWork > 0) qualityDelta += upgQualityRegenPerWork;
  }

  // ── 인시던트 자원 페널티 합산 ──
  const incidentTimeDelta = incident ? incident.time_delta : 0;
  const incidentRiskDelta = incident ? incident.risk_delta : 0;

  // ── System 1: STREAK 업데이트 ──
  const newStreak = isSuccess ? (run.current_streak ?? 0) + 1 : 0;
  const streakXpMult = computeStreakXpMult(newStreak);
  const streakMessages: string[] = [];
  if (newStreak === 3) streakMessages.push("[연속 x3] XP x1.5!");
  if (newStreak === 5) streakMessages.push("[연속 x5] XP x2 + 치명타 임계값 강화!");
  if (newStreak >= 10 && (newStreak - 10) % 5 === 0) {
    streakMessages.push(`[연속 x${newStreak}] 다음 work 자동 치명타 예약!`);
  }

  // ── Effects 갱신 ──
  const tickedEffects = tickEffects(activeEffects);
  const triggerEffects = computeNewEffects(isCritical, isFumble, newStreak);
  // 같은 type은 신규가 덮어씀
  const effectMap = new Map<StatusEffectType, ActiveEffect>();
  for (const e of tickedEffects) effectMap.set(e.type, e);
  for (const e of triggerEffects) effectMap.set(e.type, e);
  const finalEffects: ActiveEffect[] = Array.from(effectMap.values());

  // ── 최종 자원 계산 (커피 셋업: work마다 TIME 회복) ──
  const newTime = Math.max(0, run.time - timeCost + incidentTimeDelta + upgTimeBonusPerWork);
  const newRisk = Math.min(MAX_RISK, Math.max(0, run.risk + riskDelta + incidentRiskDelta));
  const newDebt = Math.min(MAX_DEBT, Math.max(0, run.debt + debtDelta));
  const newQuality = Math.min(100, Math.max(0, run.quality + qualityDelta));

  // ── 페이즈 자동 진행 ──
  const phaseOrder = ["plan", "implement", "test", "deploy", "operate"];
  const phaseIndex = phaseOrder.indexOf(run.phase);
  const thresholdPerPhase = run.tier * 2;
  const requiredTotal = thresholdPerPhase * (phaseIndex + 1);

  const { count: prevWorkCount } = await db
    .from("run_commands")
    .select("id", { count: "exact", head: true })
    .eq("run_id", run.id)
    .eq("command", "work");
  const newWorkCount = (prevWorkCount ?? 0) + 1;

  let newPhase = run.phase;
  let phaseAdvanced = false;
  let autoCompleted = false;

  if (phaseIndex === 4 && newWorkCount >= requiredTotal) {
    autoCompleted = true;
  } else if (phaseIndex < 4 && newWorkCount >= requiredTotal) {
    phaseAdvanced = true;
    newPhase = phaseOrder[phaseIndex + 1];
  }

  // ── DB 업데이트 ──
  const updateData: Record<string, unknown> = {
    time: newTime,
    risk: newRisk,
    debt: newDebt,
    quality: newQuality,
    current_streak: newStreak,
    active_effects: finalEffects,
    position_streak: newPositionStreak,
    position_streak_tag: newPositionStreakTag,
  };
  if (phaseAdvanced) updateData.phase = newPhase;

  if (autoCompleted) {
    const score = Math.max(0, newQuality * 10 - newDebt * 20 + newTime * 2 - newRisk * 5);
    updateData.status = "completed";
    updateData.score = score;
    updateData.ended_at = new Date().toISOString();
  } else if (newTime <= 0 || newRisk >= MAX_RISK) {
    updateData.status = "failed";
    updateData.ended_at = new Date().toISOString();
  }

  await db.from("runs").update(updateData).eq("id", run.id);

  // ── 자동완료 보상 (autoCompleted 경로: handleEnd가 호출되지 않으므로 여기서 지급) ──
  let completionBonusCredits = 0;
  if (autoCompleted) {
    const autoScore = Math.max(0, newQuality * 10 - newDebt * 20 + newTime * 2 - newRisk * 5);
    completionBonusCredits = Math.max(50, Math.floor(autoScore * 0.25) + run.tier * 30);
    await grantCredits(db, character.id, completionBonusCredits);
  }

  // ── XP 지급 (streak × 업그레이드 × 수식어 배율 적용) ──
  if (isSuccess) {
    const totalXpMult = streakXpMult * (1.0 + upgXpBonus) * modXpMult;
    const scaledXP = scaleRewardXP(ticket.reward_xp, totalXpMult);
    await grantTicketXP(db, character.id, scaledXP);
    // mid-run 크레딧 제거 — 보상은 프로젝트 완주 시에만 지급
  }

  // ── 페이즈별 플레이버 메시지 ──
  const PHASE_FLAVOR: Record<string, { success: string; fail: string; critical: string; fumble: string }> = {
    plan:      { critical: "완벽한 설계!", success: "기획 완료", fail: "방향이 불분명합니다", fumble: "요구사항 충돌 발생!" },
    implement: { critical: "깔끔한 구현!", success: "구현 완료", fail: "로직 오류 발생",    fumble: "스택 오버플로우!" },
    test:      { critical: "전체 통과!",   success: "테스트 통과", fail: "케이스 실패",   fumble: "프로덕션 버그 발견!" },
    deploy:    { critical: "무결점 배포!", success: "배포 완료", fail: "파이프라인 오류", fumble: "롤백 필요!" },
    operate:   { critical: "안정적 운영!", success: "모니터링 정상", fail: "지표 이상",   fumble: "장애 발생!" },
  };
  const flavor = PHASE_FLAVOR[run.phase] ?? PHASE_FLAVOR.implement;
  const flavorMsg = isCritical ? flavor.critical : isFumble ? flavor.fumble : isSuccess ? flavor.success : flavor.fail;

  const result = {
    ticket_key: input.ticket_key,
    success: isSuccess,
    critical: isCritical,
    fumble: isFumble,
    guaranteed_critical_consumed: hasGuaranteedCritical,
    roll: roll.toFixed(3),
    threshold: thresholds.successThreshold.toFixed(3),
    critical_threshold: thresholds.criticalThreshold.toFixed(3),
    fumble_threshold: thresholds.fumbleThreshold.toFixed(3),
    delta: { time: -timeCost, risk: riskDelta, debt: debtDelta, quality: qualityDelta },
    incident: incident
      ? { time_delta: incidentTimeDelta, risk_delta: incidentRiskDelta, message: incident.message }
      : null,
    debt_pressure: debtPressure,
    quality_crisis: qualityCrisis,
    resources: { time: newTime, risk: newRisk, debt: newDebt, quality: newQuality },
    xp_granted: isSuccess ? ticket.reward_xp : null,
    xp_multiplier: isSuccess ? streakXpMult * (1.0 + upgXpBonus) * modXpMult : 1.0,
    streak: newStreak,
    streak_messages: streakMessages,
    position_streak: newPositionStreak,
    position_streak_tag: newPositionStreakTag,
    position_synergy: positionSynergyMessage,
    active_effects: finalEffects,
    new_effects: triggerEffects,
    phase_advanced: phaseAdvanced,
    old_phase: run.phase,
    new_phase: phaseAdvanced ? newPhase : null,
    auto_completed: autoCompleted,
    completion_bonus_credits: autoCompleted ? completionBonusCredits : null,
    message: isCritical
      ? `[치명타!] ${flavorMsg} — ${input.ticket_key} ★★`
      : isFumble
      ? `[실수!] ${flavorMsg} — ${input.ticket_key} ✗✗`
      : isSuccess
      ? `[완료] ${flavorMsg} — ${input.ticket_key} ✓`
      : `[실패] ${flavorMsg} — ${input.ticket_key} ✗`,
  };

  await logCommand(db, character.id, run.id, "work", input, result, input.idempotency_key);
  await incrementCmdCount(db, run.id);
  return json({ ok: true, result });
}

// ──────────── Action: craft ────────────
async function handleCraft(
  db: ReturnType<typeof createClient>,
  character: { id: string; credits: number },
  input: Extract<RunCommandInput, { action: "craft" }>,
) {
  const run = await getActiveRun(db, character.id, input.run_id);
  if (!run) return json({ error: "활성 런을 찾을 수 없습니다" }, 404);

  const { data: artifact } = await db
    .from("artifacts")
    .select("*")
    .eq("artifact_key", input.artifact_key)
    .single();
  if (!artifact) return json({ error: "아티팩트를 찾을 수 없습니다" }, 404);

  const cost = artifact.crafting_cost as { credits: number; materials?: Record<string, number> };

  // 크레딧 검사
  const { data: char } = await db
    .from("characters")
    .select("credits")
    .eq("id", character.id)
    .single();
  if (!char || char.credits < cost.credits) {
    return json({ error: `크레딧 부족 (필요: ${cost.credits})` }, 400);
  }

  // 재료 검사
  if (cost.materials) {
    for (const [matKey, qty] of Object.entries(cost.materials)) {
      const { data: inv } = await db
        .from("inventory")
        .select("qty")
        .eq("character_id", character.id)
        .eq("artifact_key", matKey)
        .single();
      if (!inv || inv.qty < qty) {
        return json({ error: `재료 부족: ${matKey} ${qty}개 필요` }, 400);
      }
    }
  }

  // 크레딧 차감
  await db.from("characters").update({ credits: char.credits - cost.credits })
    .eq("id", character.id);

  // 재료 차감
  if (cost.materials) {
    for (const [matKey, qty] of Object.entries(cost.materials)) {
      await db.rpc("decrement_inventory", {
        p_character_id: character.id,
        p_artifact_key: matKey,
        p_qty: qty,
      });
    }
  }

  // 인벤토리에 아티팩트 추가
  await db.from("inventory").upsert({
    character_id: character.id,
    artifact_key: input.artifact_key,
    qty: 1,
  }, { onConflict: "character_id,artifact_key", ignoreDuplicates: false });

  const result = {
    artifact_key: input.artifact_key,
    name: artifact.name,
    rarity: artifact.rarity,
    message: `[제작 완료] ${artifact.name} (${artifact.rarity})`,
  };

  await logCommand(db, character.id, run.id, "craft", input, result, input.idempotency_key);
  await incrementCmdCount(db, run.id);
  return json({ ok: true, result });
}

// ──────────── Action: end ────────────
async function handleEnd(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<RunCommandInput, { action: "end" }>,
) {
  const run = await getActiveRun(db, character.id, input.run_id);
  if (!run) return json({ error: "활성 런을 찾을 수 없습니다" }, 404);

  // 점수 계산
  const score = Math.max(0,
    run.quality * 10
    - run.debt * 20
    + (run.time * 2)
    - run.risk * 5
  );

  await db.from("runs").update({
    status: "completed",
    score,
    ended_at: new Date().toISOString(),
  }).eq("id", run.id);

  // daily_character_stats 업데이트
  const today = new Date().toISOString().split("T")[0];
  await db.rpc("upsert_daily_stats", {
    p_day: today,
    p_character_id: character.id,
    p_score: score,
    p_quality: run.quality,
    p_debt_delta: run.debt,
  });

  // 런 완주 보너스 크레딧: max(50, score × 0.25 + tier × 30)
  const completionBonus = Math.max(50, Math.floor(score * 0.25) + run.tier * 30);
  await grantCredits(db, character.id, completionBonus);

  const result = {
    run_id: run.id,
    score,
    completion_bonus_credits: completionBonus,
    final_resources: {
      time: run.time,
      risk: run.risk,
      debt: run.debt,
      quality: run.quality,
    },
    message: `[런 종료] 최종 점수: ${score}  (+${completionBonus}cr 완주 보너스)`,
  };

  await logCommand(db, character.id, run.id, "end", input, result, input.idempotency_key);
  return json({ ok: true, result });
}

// ──────────── Action: draw ────────────
async function handleDraw(
  db: ReturnType<typeof createClient>,
  character: { id: string },
  input: Extract<RunCommandInput, { action: "draw" }>,
) {
  const run = await getActiveRun(db, character.id, input.run_id);
  if (!run) return json({ error: "활성 런을 찾을 수 없습니다" }, 404);

  const { data: tickets } = await db
    .from("tickets")
    .select("ticket_key, title, position_tag, base_time_cost, base_risk_delta, base_quality_delta")
    .eq("phase", run.phase);

  if (!tickets || tickets.length === 0) {
    return json({ error: "현재 페이즈에 티켓이 없습니다" }, 404);
  }

  // Fisher-Yates shuffle with seeded RNG
  const rng = seededRng(run.seed, `draw-${run.cmd_count}`);
  const shuffled = [...tickets];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const hand = shuffled.slice(0, 4);

  const result = {
    phase: run.phase,
    hand,
    current_streak: run.current_streak ?? 0,
    active_effects: (run.active_effects ?? []) as ActiveEffect[],
    position_streak: run.position_streak ?? 0,
    position_streak_tag: run.position_streak_tag ?? null,
    resources: { time: run.time, risk: run.risk, debt: run.debt, quality: run.quality },
    message: `[드로우] ${run.phase} 페이즈 티켓 ${hand.length}장 뽑음 (peek <key>로 상세 확인 가능)`,
  };

  await logCommand(db, character.id, run.id, "draw", input, result, input.idempotency_key);
  await incrementCmdCount(db, run.id);
  return json({ ok: true, result });
}

// ──────────── 유틸 함수 ────────────

async function getActiveRun(
  db: ReturnType<typeof createClient>,
  characterId: string,
  runId: string,
) {
  const { data } = await db
    .from("runs")
    .select("*")
    .eq("id", runId)
    .eq("character_id", characterId)
    .eq("status", "active")
    .single();
  return data;
}

async function logCommand(
  db: ReturnType<typeof createClient>,
  characterId: string,
  runId: string,
  command: string,
  args: Record<string, unknown>,
  result: Record<string, unknown>,
  idempotencyKey: string,
) {
  await db.from("run_commands").insert({
    run_id: runId,
    character_id: characterId,
    command,
    args,
    result,
    idempotency_key: idempotencyKey,
  });
}

async function incrementCmdCount(db: ReturnType<typeof createClient>, runId: string) {
  await db.rpc("increment_run_cmd_count", { p_run_id: runId });
}

async function grantTicketXP(
  db: ReturnType<typeof createClient>,
  characterId: string,
  rewardXP: { position?: Record<string, number>; core?: Record<string, number> },
) {
  if (rewardXP.position) {
    for (const [pos, xp] of Object.entries(rewardXP.position)) {
      await db.rpc("grant_position_xp", {
        p_character_id: characterId,
        p_position: pos,
        p_xp: xp,
      });
    }
  }
  if (rewardXP.core) {
    for (const [core, xp] of Object.entries(rewardXP.core)) {
      await db.rpc("grant_core_xp", {
        p_character_id: characterId,
        p_core: core,
        p_xp: xp,
      });
    }
  }
}

async function grantCredits(
  db: ReturnType<typeof createClient>,
  characterId: string,
  amount: number,
) {
  if (amount > 0) {
    await db.rpc("grant_credits", { p_character_id: characterId, p_amount: amount });
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
