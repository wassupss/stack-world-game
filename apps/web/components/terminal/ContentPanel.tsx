"use client";

// ============================================================
// STACKWORLD - 중앙 컨텐츠 패널
// 현재 진행 중인 솔로 런 / 레이드 / 파티 대기 상태 표시
// ============================================================

type ActiveEffect = { type: string; magnitude: number; turns_left: number };

interface PartyMember {
  character_id: string;
  characters: { name: string } | null;
}

interface Props {
  statusData: Record<string, unknown>;
  activeRunId?: string;
  activeRaidId?: string;
}

// ──────────── 페이즈 정의 ────────────
const PHASES = ["plan", "implement", "test", "deploy", "operate"] as const;
const PHASE_SHORT: Record<string, string> = {
  plan:      "기획",
  implement: "구현",
  test:      "테스트",
  deploy:    "배포",
  operate:   "운영",
};

// ──────────── 레이드 시나리오 이름 ────────────
const SCENARIO_NAMES: Record<string, string> = {
  PAYMENT_OUTAGE: "결제 시스템 아웃티지",
  DB_CORRUPTION:  "DB 데이터 손상",
  DDOS_ATTACK:    "DDoS 공격",
  GRAND_LAUNCH:   "그랜드 런칭",
};

export default function ContentPanel({ statusData, activeRunId, activeRaidId }: Props) {
  const run          = statusData.active_run  as Record<string, unknown> | null;
  const raid         = statusData.active_raid as Record<string, unknown> | null;
  const partyInfo    = statusData.party_info  as { id: string; code: string } | null;
  const partyMembers = (statusData.party_members ?? []) as PartyMember[];

  if (activeRunId && run) {
    return <RunContent run={run} />;
  }

  if (activeRaidId && raid) {
    return <RaidContent raid={raid} partyMembers={partyMembers} />;
  }

  // 파티에 있지만 레이드 없음 → 대기 상태
  if (partyInfo) {
    return <PartyWaiting partyInfo={partyInfo} partyMembers={partyMembers} />;
  }

  return null;
}

// ──────────────────────────────────────────────────────
// 솔로 런 컨텐츠
// ──────────────────────────────────────────────────────

function RunContent({ run }: { run: Record<string, unknown> }) {
  const phase     = String(run.phase ?? "plan");
  const tier      = Number(run.tier ?? 1);
  const cmdCount  = Number(run.cmd_count ?? 0);
  const streak    = Number(run.current_streak ?? 0);
  const posStreak = Number(run.position_streak ?? 0);
  const effects   = (run.active_effects ?? []) as ActiveEffect[];
  const modifier  = run.active_modifier as string | null | undefined;

  const time    = Number(run.time    ?? 0);
  const risk    = Number(run.risk    ?? 0);
  const debt    = Number(run.debt    ?? 0);
  const quality = Number(run.quality ?? 0);

  const timeColor = time  < 20 ? "red"    : time  < 40 ? "yellow" : "green";
  const riskColor = risk  > 70 ? "red"    : risk  > 50 ? "yellow" : "green";
  const debtColor = debt  > 35 ? "red"    : debt  > 20 ? "yellow" : "green";
  const qualColor = quality < 20 ? "red"  : quality < 40 ? "yellow" : "blue";

  const timeDanger = time < 20;
  const riskDanger = risk > 70;

  return (
    <div className="p-3 text-xs font-mono space-y-3">
      {/* 헤더 */}
      <div className="border-b border-green-900 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-green-400 font-bold">SOLO RUN</span>
          <span className="text-green-700 text-[10px]">
            Tier <span className="text-green-500">{tier}</span>
            <span className="mx-1">·</span>
            cmd <span className="text-green-500">{cmdCount}</span>
          </span>
        </div>
        {/* 페이즈 사다리 */}
        <div className="flex items-center gap-0.5 mt-1.5">
          {PHASES.map((p, i) => {
            const idx     = PHASES.indexOf(phase as typeof PHASES[number]);
            const isDone  = i < idx;
            const isCur   = i === idx;
            return (
              <span key={p} className="flex items-center gap-0.5">
                <span className={`text-[9px] font-mono ${
                  isCur   ? "text-green-300 font-bold underline underline-offset-2" :
                  isDone  ? "text-green-700" :
                            "text-green-900"
                }`}>
                  {PHASE_SHORT[p]}
                </span>
                {i < PHASES.length - 1 && (
                  <span className={`text-[9px] ${i < idx ? "text-green-700" : "text-green-900"}`}>›</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* 수식어 */}
      {modifier && (
        <div className="text-[10px] text-yellow-400 truncate">◈ {modifier}</div>
      )}

      {/* 자원 바 */}
      <div className="space-y-1">
        <ResourceBar label="시간" value={time}    max={100} color={timeColor} danger={timeDanger} />
        <ResourceBar label="위험" value={risk}    max={100} color={riskColor} danger={riskDanger} />
        <ResourceBar label="부채" value={debt}    max={50}  color={debtColor} danger={debt > 35}  />
        <ResourceBar label="품질" value={quality} max={100} color={qualColor} danger={quality < 20} />
      </div>

      {/* 위험 경고 */}
      {(timeDanger || riskDanger || debt > 35 || quality < 20) && (
        <div className="text-[10px] text-red-500 border border-red-900 px-2 py-0.5 text-center space-y-0.5 animate-danger">
          {timeDanger && <div>⚠ 시간 부족</div>}
          {riskDanger && <div>⚠ 위험 수준 위험</div>}
          {debt > 35 && <div>⚠ 기술 부채 압박</div>}
          {quality < 20 && <div>⚠ 코드 품질 위기</div>}
        </div>
      )}

      {/* 스트릭 */}
      {streak >= 2 && <StreakBadge streak={streak} />}

      {/* 포지션 시너지 */}
      {posStreak >= 2 && (
        <div className="flex justify-between text-[10px]">
          <span className="text-green-700">{String(run.position_streak_tag ?? "?")} 연속</span>
          <span className="text-green-400 font-bold">x{posStreak}</span>
        </div>
      )}

      {/* 활성 효과 */}
      {effects.length > 0 && <EffectsList effects={effects} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// 레이드 컨텐츠
// ──────────────────────────────────────────────────────

function RaidContent({
  raid,
  partyMembers,
}: {
  raid: Record<string, unknown>;
  partyMembers: PartyMember[];
}) {
  const scenarioKey  = String(raid.scenario_key ?? "");
  const scenarioName = SCENARIO_NAMES[scenarioKey] ?? scenarioKey;
  const tier         = Number(raid.tier ?? 1);
  const mode         = String(raid.mode ?? "");
  const status       = String(raid.status ?? "");
  const kpi          = raid.kpi as Record<string, number> | undefined;
  const timeLimitSec = Number(raid.time_limit_sec ?? 0);
  const startedAt    = raid.started_at as string | null;

  let remainingMin: number | null = null;
  if (startedAt) {
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    remainingMin  = Math.max(0, Math.floor((timeLimitSec - elapsed) / 60));
  }

  const modeLabel = mode === "incident" ? "인시던트" : mode === "launch" ? "런칭" : mode;
  const isActive  = status === "active";
  const timeLow   = remainingMin !== null && remainingMin < 3;

  return (
    <div className="p-3 text-xs font-mono space-y-3">
      {/* 헤더 */}
      <div className="border-b border-green-900 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-green-400 font-bold">RAID</span>
          <span className={`text-[10px] font-bold ${isActive ? "text-green-400" : "text-yellow-500"}`}>
            {isActive ? "● 진행 중" : "○ 대기"}
          </span>
        </div>
        <div className="text-green-300 mt-1 truncate">{scenarioName}</div>
        <div className="text-green-700 text-[10px] mt-0.5">
          Tier {tier} · {modeLabel}
          {remainingMin !== null && (
            <span className={`ml-2 ${timeLow ? "text-red-400" : "text-green-600"}`}>
              · 남은 {remainingMin}분
            </span>
          )}
          {remainingMin === null && timeLimitSec > 0 && (
            <span className="ml-2 text-green-800">· 제한 {Math.floor(timeLimitSec / 60)}분</span>
          )}
        </div>
      </div>

      {/* KPI */}
      {kpi && (
        <div className="space-y-1">
          <div className="text-green-700 text-[10px] border-b border-green-900 pb-1">── KPI ──</div>
          <KpiRow label="에러율" value={`${kpi.error_rate?.toFixed(1)}%`}  target={`<${kpi.target_error_rate}%`}  bad={kpi.error_rate   > (kpi.target_error_rate  ?? 5)}   />
          <KpiRow label="성공률" value={`${kpi.success_rate?.toFixed(1)}%`} target={`>${kpi.target_success_rate}%`} bad={kpi.success_rate < (kpi.target_success_rate ?? 95)}  />
          <KpiRow label="P95"    value={`${kpi.latency_p95}ms`}             target="<800ms"                         bad={kpi.latency_p95  > 800}                               />
        </div>
      )}

      {/* 파티원 */}
      {partyMembers.length > 0 && (
        <div className="space-y-1">
          <div className="text-green-700 text-[10px] border-b border-green-900 pb-1">
            ── 파티원 {partyMembers.length}명 ──
          </div>
          {partyMembers.map((m) => (
            <div key={m.character_id} className="text-green-500 text-[10px]">
              · {m.characters?.name ?? "???"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// 파티 대기 상태
// ──────────────────────────────────────────────────────

function PartyWaiting({
  partyInfo,
  partyMembers,
}: {
  partyInfo: { id: string; code: string };
  partyMembers: PartyMember[];
}) {
  return (
    <div className="p-3 text-xs font-mono space-y-3">
      {/* 헤더 */}
      <div className="border-b border-green-900 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-green-400 font-bold">PARTY</span>
          <span className="text-yellow-500 text-[10px]">○ 대기</span>
        </div>
        <div className="text-green-600 text-[10px] mt-1">
          코드 <span className="text-green-300 font-bold tracking-widest">{partyInfo.code}</span>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="space-y-1">
        <div className="text-green-700 text-[10px] border-b border-green-900 pb-1">
          ── 멤버 {partyMembers.length}명 ──
        </div>
        {partyMembers.map((m) => (
          <div key={m.character_id} className="text-green-500 text-[10px]">
            · {m.characters?.name ?? "???"}
          </div>
        ))}
      </div>

      {/* 액션 힌트 */}
      <div className="border-t border-green-900 pt-2 space-y-1 text-green-800 text-[10px]">
        <div><span className="text-green-600">raid start</span>  → 레이드 시작</div>
        <div><span className="text-green-600">party leave</span> → 파티 나가기</div>
      </div>
    </div>
  );
}

// ──────────── 공통 서브 컴포넌트 ────────────

const BAR_COLORS: Record<string, string> = {
  green:  "text-green-400",
  red:    "text-red-400",
  yellow: "text-yellow-400",
  blue:   "text-blue-400",
};

function ResourceBar({ label, value, max, color, danger }: {
  label: string;
  value: number;
  max: number;
  color: string;
  danger?: boolean;
}) {
  const filled = Math.round(Math.min(100, Math.max(0, (value / max) * 100)) / 10);
  const bar    = "█".repeat(filled) + "░".repeat(10 - filled);
  const cls    = BAR_COLORS[color] ?? "text-green-400";
  return (
    <div className="flex items-center gap-1">
      <span className={`w-8 shrink-0 ${danger ? "text-red-500 animate-danger" : "text-green-700"}`}>{label}</span>
      <span className={`${cls} text-[10px] ${danger ? "animate-danger" : ""}`}>{bar}</span>
      <span className={`ml-auto w-8 text-right ${danger ? "text-red-400 font-bold animate-danger" : "text-green-500"}`}>
        {value}
      </span>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const label =
    streak >= 10 ? `★★★ 무아지경 x${streak}` :
    streak >= 5  ? `★★ 불타오른다! x${streak}` :
    streak >= 3  ? `★ 연속 x${streak}` :
                   `연속 x${streak}`;
  const cls =
    streak >= 10 ? "text-yellow-300 font-bold" :
    streak >= 5  ? "text-yellow-400 font-bold" :
                   "text-green-300";
  const glowCls = streak >= 3 ? "animate-glow" : "";
  return (
    <div className={`text-center text-[10px] border border-green-800 py-0.5 ${cls} ${glowCls}`}>{label}</div>
  );
}

const EFFECT_LABELS: Record<string, string> = {
  flow_state:          "몰입  ↑성공률",
  tired:               "피로  ↑실수율",
  focused:             "집중  +5품질/턴",
  guaranteed_critical: "치명타★ 예약",
  risk_shield:         "위험  방어막",
  success_boost:       "성공  부스트",
};

function EffectsList({ effects }: { effects: ActiveEffect[] }) {
  return (
    <div className="border-t border-green-900 pt-2 space-y-0.5">
      <div className="text-green-700 text-[10px] mb-1">── 활성 효과 ──</div>
      {effects.map((e, i) => (
        <div key={i} className="flex justify-between text-[10px]">
          <span className={
            e.type === "tired"               ? "text-red-500"    :
            e.type === "guaranteed_critical" ? "text-yellow-400" :
                                               "text-green-400"
          }>
            {EFFECT_LABELS[e.type] ?? e.type}
          </span>
          <span className="text-green-700">{e.turns_left}턴</span>
        </div>
      ))}
    </div>
  );
}

function KpiRow({ label, value, target, bad }: {
  label: string;
  value: string;
  target: string;
  bad: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-green-700 w-12 shrink-0">{label}</span>
      <span className={`font-bold ${bad ? "text-red-400 animate-danger" : "text-green-400"}`}>{value}</span>
      <span className={`text-[9px] ${bad ? "text-red-900" : "text-green-900"}`}>목표 {target}</span>
    </div>
  );
}
