// ============================================================
// STACKWORLD - 커맨드 레지스트리
// 모든 가능한 커맨드 정의 + 자동완성 소스
// ============================================================

export interface CommandDef {
  name: string;
  syntax: string;
  description: string;
  examples: string[];
  category: "common" | "solo" | "party" | "raid" | "pvp" | "market" | "shop" | "community";
  unlockLevel?: number; // 특정 레벨 이상에서만 표시
}

export const COMMAND_REGISTRY: CommandDef[] = [
  // ──────────── 공통 ────────────
  {
    name: "logout",
    syntax: "logout",
    description: "현재 세션에서 로그아웃",
    examples: ["logout"],
    category: "common",
  },
  {
    name: "help",
    syntax: "help [command]",
    description: "커맨드 목록 또는 특정 커맨드 도움말 표시",
    examples: ["help", "help run", "help raid"],
    category: "common",
  },
  {
    name: "status",
    syntax: "status",
    description: "현재 캐릭터 상태, 활성 런/레이드 정보 표시",
    examples: ["status"],
    category: "common",
  },
  {
    name: "mastery",
    syntax: "mastery [position|core]",
    description: "포지션 숙련 및 공통 역량 상세 표시",
    examples: ["mastery", "mastery FE", "mastery problem_solving"],
    category: "common",
  },
  {
    name: "devpower",
    syntax: "devpower",
    description: "DevPower 점수 및 3대 지표 (DEVPOWER/RELIABILITY/THROUGHPUT) 표시",
    examples: ["devpower"],
    category: "common",
  },
  {
    name: "titles",
    syntax: "titles",
    description: "획득한 타이틀 목록 표시",
    examples: ["titles"],
    category: "common",
  },
  {
    name: "inventory",
    syntax: "inventory",
    description: "보유 아티팩트 및 재료 목록",
    examples: ["inventory"],
    category: "common",
  },

  // ──────────── 솔로 런 ────────────
  {
    name: "run",
    syntax: "run <start|status|end> [--tier N]",
    description: "솔로 런 관리. start로 새 런 시작 (tier 1~5)",
    examples: ["run start", "run start --tier 3", "run status", "run end"],
    category: "solo",
  },
  {
    name: "event",
    syntax: "event",
    description: "현재 런 페이즈의 이벤트 발생. 선택지가 제시됨",
    examples: ["event"],
    category: "solo",
  },
  {
    name: "choose",
    syntax: "choose <0|1|2|3>",
    description: "이벤트 선택지 선택 (0=안전75%, 1=균형60%, 2=위험40%, 3=도박25%). 결과는 확률로 결정됨",
    examples: ["choose 0", "choose 1", "choose 2", "choose 3"],
    category: "solo",
  },
  {
    name: "work",
    syntax: "work <ticket_key>",
    description: "티켓 처리. 현재 페이즈에 맞는 ticket_key 입력",
    examples: ["work PLAN_FE_001", "work IMPL_BE_003", "work TEST_QA_002"],
    category: "solo",
  },
  {
    name: "draw",
    syntax: "draw",
    description: "현재 페이즈의 티켓 4장을 무작위로 뽑아 선택. run start·work 완료 후 자동 실행됨. A/B/C/D 단축키 사용 가능",
    examples: ["draw"],
    category: "solo",
  },
  {
    name: "tickets",
    syntax: "tickets [phase]",
    description: "현재 페이즈(또는 지정 페이즈)의 전체 티켓 목록 조회. 포지션별 정렬",
    examples: ["tickets", "tickets implement", "tickets test"],
    category: "solo",
  },
  {
    name: "craft",
    syntax: "craft <artifact_key>",
    description: "아티팩트 제작. 재료와 크레딧 필요",
    examples: ["craft TMPL_REACT_COMPONENT", "craft PIPE_CI_CD_BASIC"],
    category: "solo",
  },

  // ──────────── 파티/레이드 ────────────
  {
    name: "party",
    syntax: "party <create|join|leave|status> [code]",
    description: "파티 관리. 레이드는 파티를 구성해야 참여 가능",
    examples: ["party create", "party join ABCD12", "party leave", "party status"],
    category: "party",
  },
  {
    name: "raid",
    syntax: "raid <start|leave|status|action|log> [--mode incident|launch] [--tier N]",
    description: "레이드 관리. 파티 없이도 혼자 시작 가능. leave로 포기 후 파티 탈퇴",
    examples: [
      "raid start",
      "raid start --mode incident --tier 1",
      "raid start --mode launch",
      "raid leave",
      "raid status",
      "raid action trace",
      "raid action rollback",
      "raid log",
    ],
    category: "raid",
  },
  {
    name: "say",
    syntax: "say <메시지>",
    description: "레이드 파티원에게 채팅 메시지 전송 (레이드 중에만 가능)",
    examples: ["say 안녕하세요!", "say 롤백 먼저 시도할게요", "say 에러율 거의 다 됐어요!"],
    category: "raid",
  },

  // ──────────── PvP ────────────
  {
    name: "pvp",
    syntax: "pvp <queue|status|submit|leaderboard> [--mode golf|speedrun] [--tier N]",
    description: "PvP 점수 경쟁. golf=최소 커맨드, speedrun=최단 시간. 솔로 플레이도 가능",
    examples: [
      "pvp queue --mode golf --tier 1",
      "pvp queue --mode speedrun",
      "pvp status",
      "pvp submit",
      "pvp leaderboard",
      "pvp leaderboard --mode speedrun",
    ],
    category: "pvp",
  },

  // ──────────── 상점 ────────────
  {
    name: "shop",
    syntax: "shop <list|buy|use|equip|unequip> [item_key]",
    description: "상점 조회/구매/소모품 사용/수식어 장착. 크레딧으로 영구 업그레이드·스킬·소모품 구매",
    examples: [
      "shop list",
      "shop list upgrade",
      "shop list consumable",
      "shop buy UPG_CRIT_BOOST",
      "shop use ITEM_COFFEE",
      "shop equip MOD_SPEEDRUN",
      "shop unequip",
    ],
    category: "shop",
  },
  {
    name: "refactor",
    syntax: "refactor",
    description: "[스킬] 런 중 DEBT -20 (SKILL_REFACTOR 구매 필요, 쿨다운 있음)",
    examples: ["refactor"],
    category: "shop",
  },
  {
    name: "code_review",
    syntax: "code_review",
    description: "[스킬] 런 중 RISK -15, QUAL +5 (SKILL_CODE_REVIEW 구매 필요, 쿨다운 있음)",
    examples: ["code_review"],
    category: "shop",
  },

  // ──────────── 경제 ────────────
  {
    name: "market",
    syntax: "market <list|sell|buy> [artifact_key] [qty] [price]",
    description: "마켓 조회/판매/구매. 즉시구매 형태만 지원",
    examples: [
      "market list",
      "market list TMPL",
      "market sell TMPL_REACT_COMPONENT 1 200",
      "market buy <listing_id>",
    ],
    category: "market",
  },
  {
    name: "contract",
    syntax: "contract list",
    description: "납품 계약 목록 조회",
    examples: ["contract list"],
    category: "market",
  },
  {
    name: "deliver",
    syntax: "deliver <contract_id>",
    description: "계약 납품. 보유 아티팩트로 계약 이행",
    examples: ["deliver <contract_id>"],
    category: "market",
  },

  // ──────────── 커뮤니티 ────────────
  {
    name: "community",
    syntax: "community",
    description: "커뮤니티 패널 열기 (전역 채팅 + 친구 목록)",
    examples: ["community"],
    category: "community",
  },
  {
    name: "cc",
    syntax: "cc <메시지>",
    description: "커뮤니티 전역 채팅 전송. 메시지 없이 입력하면 패널 열기",
    examples: ["cc 안녕하세요!", "cc 레이드 파티 구합니다", "cc"],
    category: "community",
  },
  {
    name: "friend",
    syntax: "friend <list|add|accept|remove> [캐릭터명]",
    description: "친구 관계 관리. list로 친구/요청 확인, add로 친구 요청",
    examples: [
      "friend list",
      "friend add DevKim",
      "friend accept DevKim",
      "friend remove DevKim",
    ],
    category: "community",
  },
];

// 커맨드 이름 → 정의 매핑
export const COMMAND_MAP = new Map(
  COMMAND_REGISTRY.map((cmd) => [cmd.name, cmd]),
);

// 자동완성: 현재 입력에 맞는 커맨드 목록 반환
export function getAutocompleteSuggestions(
  input: string,
  unlockedCommands?: string[],
): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  const available = unlockedCommands
    ? COMMAND_REGISTRY.filter((c) => unlockedCommands.includes(c.name))
    : COMMAND_REGISTRY;

  return available
    .filter((cmd) => cmd.name.startsWith(trimmed) || cmd.syntax.toLowerCase().includes(trimmed))
    .map((cmd) => cmd.syntax)
    .slice(0, 8);
}

// 티켓 키 자동완성 소스 (런타임에 DB에서 조회 후 캐시)
let ticketKeyCache: string[] = [];
export function setTicketKeyCache(keys: string[]) {
  ticketKeyCache = keys;
}
export function getTicketKeySuggestions(prefix: string): string[] {
  return ticketKeyCache.filter((k) => k.toLowerCase().startsWith(prefix.toLowerCase())).slice(0, 10);
}
