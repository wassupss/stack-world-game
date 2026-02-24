"use client";

// ============================================================
// STACKWORLD - 우측 상태 패널
// CSS 캐릭터 아바타 + 능력치 보너스 + 기본 정보 + 숙련도
// ============================================================

interface Props {
  statusData: Record<string, unknown>;
}

type OwnedUpgrade = { item_key: string; level: number };
type OwnedItem    = { item_key: string; qty: number };

export default function StatusPanel({ statusData }: Props) {
  const char           = statusData.character as Record<string, unknown>;
  const queuedModifier = char?.queued_modifier as string | null | undefined;
  const posMastery     = (statusData.positionMastery ?? []) as Array<{ position: string; level: number }>;
  const coreMastery    = (statusData.coreMastery     ?? []) as Array<{ core: string; level: number }>;
  const ownedUpgrades  = (statusData.owned_upgrades  ?? []) as OwnedUpgrade[];
  const ownedItems     = (statusData.owned_items     ?? []) as OwnedItem[];

  return (
    <div className="p-3 text-xs font-mono space-y-4">

      {/* CSS 캐릭터 아바타 */}
      <CharacterAvatar
        ownedUpgrades={ownedUpgrades}
        ownedItems={ownedItems}
        queuedModifier={queuedModifier}
      />

      <Section title="CHARACTER">
        <Row label="이름"   value={String(char?.name    ?? "")} />
        <Row label="크레딧" value={`${char?.credits ?? 0}cr`}  />
        {queuedModifier && (
          <div className="text-[10px] text-yellow-500 mt-1">◈ 장착: {queuedModifier}</div>
        )}
      </Section>

      {/* 보유 업그레이드/장비 능력치 합산 표시 */}
      <BonusSummary ownedUpgrades={ownedUpgrades} />

      <Section title="MASTERY">
        {posMastery.map((m) => (
          <MasteryBar key={m.position} label={m.position} level={m.level} maxLevel={50} />
        ))}
        <div className="mt-1 border-t border-green-900 pt-1">
          {coreMastery.slice(0, 3).map((m) => (
            <Row key={m.core} label={m.core.slice(0, 12)} value={`Lv.${m.level}`} />
          ))}
        </div>
      </Section>

    </div>
  );
}

// ──────────── 능력치 보너스 합산 섹션 ────────────

// item_key → effect 정의 (run_command와 동일한 매핑)
const UPGRADE_EFFECTS: Record<string, Record<string, number>> = {
  UPG_CRIT_BOOST:       { crit_threshold_delta: -0.02 },
  UPG_FUMBLE_SHIELD:    { fumble_threshold_delta: -0.02 }, // 음수 = 감소 = 방어
  UPG_TIME_EFFICIENCY:  { time_cost_reduction: 1 },
  UPG_RISK_DAMPENER:    { incident_prob_reduction_pct: 20 },
  UPG_XP_AMPLIFIER:     { xp_multiplier_bonus: 0.1 },
  UPG_QUAL_BASELINE:    { starting_quality_bonus: 5 },
  EQUIP_HEADPHONES:     { quality_regen_per_work: 2 },
  EQUIP_MECH_KEYBOARD:  { success_threshold_delta: -0.02 },
  EQUIP_DUAL_MONITOR:   { starting_time_bonus: 8 },
  EQUIP_HOODIE:         { starting_risk_reduction: 3 },
  EQUIP_COFFEE_SETUP:   { time_bonus_per_work: 1 },
};

function BonusSummary({ ownedUpgrades }: { ownedUpgrades: OwnedUpgrade[] }) {
  if (ownedUpgrades.length === 0) return null;

  // 합산
  let critDelta = 0, fumbleDelta = 0, timeCostRed = 0, incidentRed = 0;
  let xpBonus = 0, qualBaseline = 0, qualRegen = 0;
  let successDelta = 0, startingTime = 0, startingRisk = 0, timeBonusWork = 0;

  for (const u of ownedUpgrades) {
    const ef = UPGRADE_EFFECTS[u.item_key];
    if (!ef) continue;
    const lv = u.level;
    if (ef.crit_threshold_delta)       critDelta     += ef.crit_threshold_delta * lv;
    if (ef.fumble_threshold_delta)     fumbleDelta   += ef.fumble_threshold_delta * lv;
    if (ef.time_cost_reduction)        timeCostRed   += ef.time_cost_reduction * lv;
    if (ef.incident_prob_reduction_pct) incidentRed  += ef.incident_prob_reduction_pct * lv;
    if (ef.xp_multiplier_bonus)        xpBonus       += ef.xp_multiplier_bonus * lv;
    if (ef.starting_quality_bonus)     qualBaseline  += ef.starting_quality_bonus * lv;
    if (ef.quality_regen_per_work)     qualRegen     += ef.quality_regen_per_work * lv;
    if (ef.success_threshold_delta)    successDelta  += ef.success_threshold_delta * lv;
    if (ef.starting_time_bonus)        startingTime  += ef.starting_time_bonus * lv;
    if (ef.starting_risk_reduction)    startingRisk  += ef.starting_risk_reduction * lv;
    if (ef.time_bonus_per_work)        timeBonusWork += ef.time_bonus_per_work * lv;
  }

  const rows: { label: string; value: string; color: string }[] = [];
  if (critDelta !== 0)    rows.push({ label: "CRIT%",      value: `임계 ${(critDelta*100).toFixed(0)}%`,    color: "text-yellow-500" });
  if (fumbleDelta !== 0)  rows.push({ label: "FUMBLE방어",  value: `−${(Math.abs(fumbleDelta)*100).toFixed(0)}%`, color: "text-blue-400"   });
  if (successDelta !== 0) rows.push({ label: "성공률",      value: `임계 ${(successDelta*100).toFixed(0)}%`, color: "text-green-400"  });
  if (timeCostRed !== 0)  rows.push({ label: "TIME효율",    value: `−${timeCostRed}/work`,                  color: "text-cyan-400"   });
  if (incidentRed !== 0)  rows.push({ label: "사고확률",    value: `−${incidentRed}%`,                      color: "text-green-400"  });
  if (xpBonus !== 0)      rows.push({ label: "XP",          value: `+${(xpBonus*100).toFixed(0)}%`,         color: "text-yellow-400" });
  if (qualBaseline !== 0) rows.push({ label: "시작QUAL",    value: `+${qualBaseline}`,                      color: "text-green-400"  });
  if (qualRegen !== 0)    rows.push({ label: "QUAL재생",    value: `+${qualRegen}/work`,                    color: "text-green-300"  });
  if (startingTime !== 0) rows.push({ label: "시작TIME",    value: `+${startingTime}`,                      color: "text-cyan-400"   });
  if (startingRisk !== 0) rows.push({ label: "시작RISK",    value: `−${startingRisk}`,                      color: "text-green-400"  });
  if (timeBonusWork !== 0)rows.push({ label: "TIME회복",    value: `+${timeBonusWork}/work`,                color: "text-cyan-300"   });

  if (rows.length === 0) return null;

  return (
    <div>
      <div className="text-green-600 border-b border-green-900 pb-1 mb-2">── BONUSES ──</div>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-[10px]">
          <span className="text-green-800">{r.label}</span>
          <span className={r.color}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ──────────── CSS-only 개발자 캐릭터 아바타 ────────────

function CharacterAvatar({
  ownedUpgrades,
  ownedItems,
  queuedModifier,
}: {
  ownedUpgrades: OwnedUpgrade[];
  ownedItems: OwnedItem[];
  queuedModifier: string | null | undefined;
}) {
  const hasUpgrade = (key: string) => ownedUpgrades.some((u) => u.item_key === key);
  const upgLevel   = (key: string) => ownedUpgrades.find((u) => u.item_key === key)?.level ?? 0;
  const hasSkill   = (key: string) => ownedUpgrades.some((u) => u.item_key === key);
  const hasItem    = (key: string) => ownedItems.some((i) => i.item_key === key && i.qty > 0);

  const modKey      = queuedModifier ?? "";
  const isChallenge = modKey === "MOD_CHALLENGE";
  const isSpeedrun  = modKey === "MOD_SPEEDRUN";
  const isSafeMode  = modKey === "MOD_SAFE_MODE";

  // 장비 보유 여부
  const hasHeadphones = hasUpgrade("EQUIP_HEADPHONES");
  const hasMechKb     = hasUpgrade("EQUIP_MECH_KEYBOARD");
  const hasDualMon    = hasUpgrade("EQUIP_DUAL_MONITOR");
  const hasHoodie     = hasUpgrade("EQUIP_HOODIE");
  const hasCoffee     = hasUpgrade("EQUIP_COFFEE_SETUP") || hasItem("ITEM_COFFEE") || hasItem("ITEM_ENERGY_DRINK");

  // 테마 색상 (수식어 > 장비 순서)
  const headBorder  = isChallenge ? "border-red-500"
    : isSpeedrun  ? "border-blue-400"
    : isSafeMode  ? "border-teal-500"
    : hasHeadphones ? "border-purple-500"
    : "border-green-500";

  const bodyBorder  = isChallenge ? "border-red-700"
    : isSpeedrun  ? "border-blue-600"
    : isSafeMode  ? "border-teal-700"
    : hasHoodie   ? "border-indigo-600"
    : "border-green-700";

  const eyeColor    = isChallenge ? "bg-red-400"
    : isSpeedrun  ? "bg-blue-400"
    : hasUpgrade("UPG_CRIT_BOOST") ? "bg-yellow-400"
    : "bg-green-400";

  const laptopBorder = isChallenge ? "border-red-800"
    : isSpeedrun  ? "border-blue-700"
    : isSafeMode  ? "border-teal-800"
    : hasDualMon  ? "border-cyan-700"
    : "border-green-600";

  const kbBorder = hasMechKb
    ? "border-yellow-800"
    : hasUpgrade("UPG_FUMBLE_SHIELD") ? "border-blue-800"
    : "border-green-900";

  const screenContent = isSpeedrun ? "⚡ ⚡"
    : isChallenge ? "!! !!"
    : hasDualMon  ? "██ ██"
    : hasUpgrade("UPG_TIME_EFFICIENCY") ? "⌛ ─"
    : "_ ▌";

  const screenColor = isChallenge ? "text-red-500"
    : isSpeedrun  ? "text-blue-400"
    : hasDualMon  ? "text-cyan-500"
    : "text-green-500";

  const bodyIcon = hasSkill("SKILL_REFACTOR")
    ? { char: "⚙", color: "text-yellow-500" }
    : hasSkill("SKILL_CODE_REVIEW")
    ? { char: "◎", color: "text-cyan-400" }
    : upgLevel("UPG_QUAL_BASELINE") >= 2
    ? { char: "★", color: "text-green-600" }
    : null;

  const showAntenna = hasUpgrade("UPG_XP_AMPLIFIER");
  const showHelmet  = hasUpgrade("UPG_RISK_DAMPENER");
  const showGlasses = hasSkill("SKILL_CODE_REVIEW");

  // 후드티: 몸통 위에 hood 표시
  const showHood = hasHoodie;

  return (
    <div className="border-b border-green-900 pb-3">
      <div className="text-green-600 pb-1 text-[10px]">── AVATAR ──</div>
      <div className="flex items-end gap-1">
        {/* 캐릭터 본체 */}
        <div className="flex flex-col items-center gap-0.5 mx-auto">

          {/* 안테나 (XP 증폭기) */}
          {showAntenna && (
            <div className="text-[8px] text-yellow-400 leading-none tracking-wider">╤═╤</div>
          )}

          {/* 헤드폰 (EQUIP_HEADPHONES) — 머리 좌우 */}
          <div className="flex items-center gap-0.5">
            {hasHeadphones && <div className="w-1.5 h-4 border border-purple-600 bg-purple-950" />}

            {/* 머리 */}
            <div
              className={`w-7 h-5 border-2 ${headBorder} bg-black flex items-center justify-center relative`}
            >
              {showHelmet && (
                <div className="absolute -top-2 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="text-[7px] text-yellow-500 leading-none">▓▓▓</span>
                </div>
              )}
              <div className="flex gap-1.5">
                <div className={`w-1.5 h-1 ${eyeColor}`} />
                <div className={`w-1.5 h-1 ${eyeColor}`} />
              </div>
              {showGlasses && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
                  <span className="text-[6px] text-cyan-400 leading-none">◡◡</span>
                </div>
              )}
            </div>

            {hasHeadphones && <div className="w-1.5 h-4 border border-purple-600 bg-purple-950" />}
          </div>

          {/* 후드 플랩 (EQUIP_HOODIE) */}
          {showHood && (
            <div className="flex gap-0.5">
              <div className="w-2 h-1 border-b border-x border-indigo-700 bg-indigo-950" />
              <div className="w-2 h-1 border-b border-x border-indigo-700 bg-indigo-950" />
            </div>
          )}

          {/* 팔 + 몸통 */}
          <div className="flex items-center gap-0.5">
            <div className={`w-1.5 h-5 border ${bodyBorder} ${hasUpgrade("UPG_CRIT_BOOST") ? "bg-red-950" : ""}`} />
            <div className={`w-9 h-6 border-2 ${bodyBorder} ${showHood ? "bg-indigo-950" : ""} flex items-center justify-center`}>
              {bodyIcon && <span className={`text-[9px] ${bodyIcon.color}`}>{bodyIcon.char}</span>}
            </div>
            <div className={`w-1.5 h-5 border ${bodyBorder} ${hasUpgrade("UPG_CRIT_BOOST") ? "bg-red-950" : ""}`} />
          </div>

          {/* 허리 */}
          <div className={`w-6 h-1.5 border-b border-x ${bodyBorder}`} />

          {/* 노트북 스크린 (듀얼 모니터면 좀 더 넓게) */}
          <div
            className={`${hasDualMon ? "w-[72px]" : "w-14"} h-5 border ${laptopBorder} bg-black flex items-center justify-center`}
          >
            <span className={`text-[7px] font-mono ${screenColor}`}>{screenContent}</span>
          </div>

          {/* 노트북 키보드 */}
          <div className={`${hasDualMon ? "w-[80px]" : "w-16"} h-2 border-b border-x ${kbBorder} ${hasMechKb ? "bg-yellow-950" : ""}`} />

          {/* 수식어 배지 */}
          {queuedModifier && (
            <div
              className={`mt-1 text-[7px] px-1 border ${
                isChallenge ? "border-red-800 text-red-500"
                : isSpeedrun  ? "border-blue-800 text-blue-400"
                : "border-teal-800 text-teal-500"
              }`}
            >
              {isChallenge ? "◈ CHALLENGE" : isSpeedrun ? "◈ SPEEDRUN" : "◈ SAFE MODE"}
            </div>
          )}
        </div>

        {/* 커피/음료 소품 */}
        {hasCoffee && (
          <div className="flex flex-col items-center mb-3 gap-0.5">
            <div className="text-[12px] text-yellow-700 leading-none">☕</div>
            {hasUpgrade("EQUIP_COFFEE_SETUP") && (
              <div className="text-[6px] text-yellow-900">PREM</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────── 서브 컴포넌트 ────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-green-600 border-b border-green-900 pb-1 mb-2">── {title} ──</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-green-700">{label}</span>
      <span className="text-green-500">{value}</span>
    </div>
  );
}

function MasteryBar({ label, level, maxLevel }: { label: string; level: number; maxLevel: number }) {
  const filled = Math.round(Math.min(100, (level / maxLevel) * 100) / 10);
  const bar    = "█".repeat(filled) + "░".repeat(10 - filled);
  return (
    <div className="flex items-center gap-2">
      <span className="text-green-700 w-10 shrink-0">{label}</span>
      <span className="text-green-600 text-[10px]">{bar}</span>
      <span className="text-green-500 ml-auto">{level}</span>
    </div>
  );
}
