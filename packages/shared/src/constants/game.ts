// ============================================================
// STACKWORLD - 게임 상수 정의
// ============================================================

// ──────────── Free Tier 제약 ────────────
export const MAX_CONCURRENT_RAIDS = 3;
export const CMD_RATE_LIMIT_PER_SEC = 4;
export const LOG_RETENTION_DAYS = 14;
export const LOG_RETENTION_MAX_ROWS = 5_000;
export const MAX_PARTY_SIZE = 5;
export const MIN_PARTY_SIZE = 3;
export const DAILY_CONTRACTS = 10;

// ──────────── 시즌 ────────────
export const SEASON_DURATION_WEEKS = 4;

// ──────────── 숙련 / XP 공식 ────────────
export const LEVEL_XP_BASE = 100;           // level 1 → 2에 필요한 XP
export const LEVEL_XP_MULTIPLIER = 1.5;    // 레벨당 배율 (소프트캡)
export const SOFT_CAP_START = 30;           // 이 레벨 이후 증가폭 완만
export const SOFT_CAP_FACTOR = 0.7;        // 소프트캡 이후 XP 효율 배율

// 포지션 숙련이 action 효율에 미치는 규칙
export const MASTERY_TIME_REDUCE_PER_LEVEL = 0.02;   // 레벨당 2% 시간 감소
export const MASTERY_SUCCESS_BOOST_PER_LEVEL = 0.01; // 레벨당 1% 성공률 증가
export const MASTERY_QUALITY_BOOST_PER_LEVEL = 0.5;  // 레벨당 +0.5 quality

// ──────────── DevPower 공식 ────────────
// devpower = sum(position_levels) * 1.0
//          + sum(core_levels) * 1.5
//          + balance_bonus (최저 포지션 레벨 * 5)
export const DEVPOWER_POSITION_WEIGHT = 1.0;
export const DEVPOWER_CORE_WEIGHT = 1.5;
export const DEVPOWER_BALANCE_BONUS_MULT = 5;

// ──────────── 런 자원 초기값 ────────────
export const RUN_INITIAL_TIME = 100;
export const RUN_INITIAL_RISK = 10;
export const RUN_INITIAL_DEBT = 0;
export const RUN_INITIAL_QUALITY = 50;

// ──────────── 런 자원 한계 ────────────
export const RUN_MAX_RISK = 100;
export const RUN_MAX_DEBT = 50;
export const RUN_MIN_QUALITY = 0;
export const RUN_MAX_QUALITY = 100;

// ──────────── PvP 점수 공식 ────────────
// Code Golf: score = (1000 / command_count) * (quality / 100) - (debt * 10) - (elapsed_sec * 0.1)
export const GOLF_CMD_WEIGHT = 1000;
export const GOLF_QUALITY_WEIGHT = 1.0;
export const GOLF_DEBT_PENALTY = 10;
export const GOLF_TIME_PENALTY = 0.1;

// Speedrun: score = (10000 / elapsed_sec) * (quality / 100) - (debt * 20)
export const SPEEDRUN_TIME_WEIGHT = 10000;
export const SPEEDRUN_QUALITY_WEIGHT = 1.0;
export const SPEEDRUN_DEBT_PENALTY = 20;

// ──────────── 레이드 시간 제한 ────────────
export const RAID_INCIDENT_TIME_SEC = 60 * 15;   // 15분
export const RAID_LAUNCH_DURATION_HOURS = 48;    // 48시간

// ──────────── 커맨드 목록 ────────────
export const COMMANDS = {
  // 공통
  HELP: "help",
  STATUS: "status",
  MASTERY: "mastery",
  DEVPOWER: "devpower",
  TITLES: "titles",
  INVENTORY: "inventory",
  // 솔로
  RUN: "run",
  EVENT: "event",
  CHOOSE: "choose",
  WORK: "work",
  CRAFT: "craft",
  // 파티/레이드
  PARTY: "party",
  RAID: "raid",
  // PvP
  PVP: "pvp",
  // 경제
  MARKET: "market",
  CONTRACT: "contract",
  DELIVER: "deliver",
} as const;

// ──────────── 포지션 목록 ────────────
export const POSITIONS = ["FE", "BE", "INFRA", "QA"] as const;

// ──────────── 공통 역량 목록 ────────────
export const CORE_SKILLS = [
  "problem_solving",
  "debugging",
  "design",
  "delivery",
  "collaboration",
] as const;

// ──────────── 런 페이즈 ────────────
export const RUN_PHASES = ["plan", "implement", "test", "deploy", "operate"] as const;

// ──────────── 아티팩트 타입 ────────────
export const ARTIFACT_TYPES = ["template", "pipeline", "observability", "pattern"] as const;

// ──────────── 레이드 액션 키 ────────────
export const RAID_ACTIONS = [
  "trace",
  "rollback",
  "canary",
  "quarantine",
  "patch",
  "scale",
  "alert_tune",
  "hotfix",
  "cache_bust",
  "circuit_break",
] as const;
