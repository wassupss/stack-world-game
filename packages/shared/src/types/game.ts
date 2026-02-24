// ============================================================
// STACKWORLD - 공유 게임 타입 정의
// ============================================================

export type Position = "FE" | "BE" | "INFRA" | "QA";
export type CoreSkill =
  | "problem_solving"
  | "debugging"
  | "design"
  | "delivery"
  | "collaboration";
export type RunPhase = "plan" | "implement" | "test" | "deploy" | "operate";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type ArtifactType = "template" | "pipeline" | "observability" | "pattern";
export type RaidMode = "incident" | "launch";
export type PvpMode = "golf" | "speedrun";
export type RunStatus = "active" | "completed" | "failed" | "abandoned";
export type RaidStatus = "waiting" | "active" | "completed" | "failed";
export type PvpMatchStatus = "queuing" | "active" | "completed";

// ──────────── 캐릭터 / 숙련 ────────────
export interface Profile {
  user_id: string;
  handle: string;
  created_at: string;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface PositionMastery {
  character_id: string;
  position: Position;
  xp: number;
  level: number;
  updated_at: string;
}

export interface CoreMastery {
  character_id: string;
  core: CoreSkill;
  xp: number;
  level: number;
  updated_at: string;
}

export interface CharacterTitle {
  character_id: string;
  title_key: string;
  earned_at: string;
}

// ──────────── 3대 지표 ────────────
export interface DevStats {
  devpower: number;     // 포지션 합산 + 공통역량 가중 + 균형 보너스
  reliability: number;  // 회귀/장애/저주 억제 점수
  throughput: number;   // time 대비 처리량
}

// ──────────── 콘텐츠 카탈로그 ────────────
export interface Ticket {
  ticket_key: string;
  phase: RunPhase;
  position_tag: Position;
  title: string;
  description: string;
  base_time_cost: number;       // 1~5
  base_risk_delta: number;      // -2~+3
  base_quality_delta: number;   // -2~+3
  reward_xp: RewardXP;
  reward_items: RewardItems;
}

export interface RewardXP {
  position?: Partial<Record<Position, number>>;
  core?: Partial<Record<CoreSkill, number>>;
}

export interface RewardItems {
  credits?: number;
  materials?: Record<string, number>;
}

export interface GameEvent {
  event_key: string;
  phase: RunPhase;
  severity: number;   // 1~5
  title: string;
  description: string;
  choices: EventChoice[];
  tags: string[];
}

export interface EventChoice {
  label: string;
  description: string;
  required_command?: string;    // 해금 커맨드가 있으면 고급 선택지
  time_delta: number;
  risk_delta: number;
  debt_delta: number;
  quality_delta: number;
  bonus_event_chance?: number;  // 추가 이벤트 발생 확률 0~1
}

export interface Artifact {
  artifact_key: string;
  name: string;
  type: ArtifactType;
  rarity: Rarity;
  description: string;
  base_effect: ArtifactEffect;
  crafting_cost: CraftingCost;
}

export interface ArtifactEffect {
  ticket_modifiers?: {
    phase?: RunPhase;
    position?: Position;
    time_mult?: number;
    risk_mult?: number;
    quality_add?: number;
    debt_add?: number;
  };
  raid_kpi_bonus?: {
    error_rate_reduce?: number;
    success_rate_add?: number;
  };
  passive?: string;   // 설명용 passive 효과
}

export interface CraftingCost {
  credits: number;
  materials?: Record<string, number>;
}

export interface Blueprint {
  id: string;
  character_id: string;
  artifact_key: string;
  quality_grade: "B" | "A" | "S";
  created_at: string;
}

export interface Inventory {
  character_id: string;
  artifact_key: string;
  qty: number;
}

// ──────────── 런 ────────────
export interface ActiveEffect {
  type: "flow_state" | "tired" | "focused" | "guaranteed_critical";
  magnitude: number;
  turns_left: number;
}

export interface Run {
  id: string;
  character_id: string;
  season_id: string;
  tier: number;
  seed: string;
  status: RunStatus;
  phase: RunPhase;
  time: number;
  risk: number;
  debt: number;
  quality: number;
  score: number;
  cmd_count: number;
  current_streak: number;
  active_effects: ActiveEffect[];
  position_streak: number;
  position_streak_tag: string | null;
  started_at: string;
  ended_at?: string;
}

export interface RunCommand {
  id: string;
  run_id: string;
  character_id: string;
  command: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  idempotency_key: string;
  created_at: string;
}

export interface RunEvent {
  id: string;
  run_id: string;
  event_key: string;
  phase: RunPhase;
  choice_index?: number;
  result: Record<string, unknown>;
  created_at: string;
}

// ──────────── 레이드 ────────────
export interface Raid {
  id: string;
  party_id: string;
  scenario_key: string;
  mode: RaidMode;
  tier: number;
  status: RaidStatus;
  kpi: RaidKPI;
  time_limit_sec: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface RaidKPI {
  error_rate: number;      // 0~100
  latency_p95: number;     // ms
  success_rate: number;    // 0~100
  deploy_health?: number;  // 0~100
  target_error_rate: number;
  target_success_rate: number;
}

export interface RaidEvent {
  id: string;
  raid_id: string;
  type: string;
  payload: Record<string, unknown>;
  actor_id?: string;
  created_at: string;
}

export interface RaidCommand {
  id: string;
  raid_id: string;
  character_id: string;
  action_key: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  idempotency_key: string;
  created_at: string;
}

// ──────────── 파티 ────────────
export interface Party {
  id: string;
  code: string;
  leader_id: string;
  members: string[];
  created_at: string;
}

// ──────────── 시즌 / PvP ────────────
export interface Season {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export interface PvpMatch {
  id: string;
  mode: PvpMode;
  tier: number;
  seed: string;
  season_id: string;
  status: PvpMatchStatus;
  created_at: string;
}

export interface PvpEntry {
  id: string;
  match_id: string;
  character_id: string;
  score: number;
  command_count?: number;
  elapsed_sec?: number;
  quality?: number;
  debt_penalty?: number;
  submitted_at?: string;
  rank?: number;
}

export interface Leaderboard {
  season_id: string;
  mode: PvpMode;
  character_id: string;
  total_score: number;
  match_count: number;
  rank: number;
  updated_at: string;
}

// ──────────── 경제 ────────────
export interface MarketListing {
  id: string;
  seller_id: string;
  artifact_key: string;
  qty: number;
  price_credits: number;
  created_at: string;
}

export interface Contract {
  id: string;
  contract_key: string;
  target_artifact_key: string;
  qty_required: number;
  reward_credits: number;
  reward_xp?: RewardXP;
  expires_at: string;
  filled_by?: string;
  created_at: string;
}

// ──────────── 통계 / 운영 ────────────
export interface DailyCharacterStats {
  day: string;
  character_id: string;
  runs_count: number;
  avg_score: number;
  avg_quality: number;
  avg_debt_delta: number;
}

export interface CleanupJob {
  job_key: string;
  last_run_at: string;
}
