// ============================================================
// STACKWORLD - 커맨드 타입 정의
// ============================================================

export type CommandCategory = "common" | "solo" | "party" | "raid" | "pvp" | "market" | "shop";

export interface CommandDef {
  name: string;
  category: CommandCategory;
  syntax: string;
  description: string;
  examples: string[];
  unlock_condition?: string;   // 해금 조건 (레벨/숙련 등)
}

export interface ParsedCommand {
  name: string;
  subcommand?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

export interface CommandResult {
  ok: boolean;
  message: string;
  data?: Record<string, unknown>;
  logs?: LogLine[];
}

export type LogLevel =
  | "info"
  | "warn"
  | "error"
  | "success"
  | "system"
  | "ascii"
  | "interactive" // 클릭 가능한 버튼/카드
  | "roll";       // 애니메이션 다이스 롤

export interface InteractiveItem {
  label: string;
  command: string;
  meta?: string;
  badge?: string;
  key?: string; // 단축키 (0/1/2 또는 A/B/C)
}

export interface LogLine {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

export interface QuickMode {
  hint: string;
  map: Record<string, string>; // key → command (e.g. "0" → "choose 0")
}

// Edge Function 요청/응답
export interface RunCommandRequest {
  action: "start" | "event" | "choose" | "work" | "craft" | "end";
  run_id?: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
}

export interface RaidCommandRequest {
  action: "join" | "action" | "resolve";
  raid_id: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
}

export interface PvpSubmitRequest {
  match_id: string;
  mode: "golf" | "speedrun";
  run_id: string;
  idempotency_key: string;
}

export interface MarketTradeRequest {
  action: "buy" | "sell" | "deliver";
  listing_id?: string;
  contract_id?: string;
  artifact_key?: string;
  qty?: number;
  price?: number;
  idempotency_key: string;
}
