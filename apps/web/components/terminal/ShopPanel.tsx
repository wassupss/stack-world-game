"use client";

// ============================================================
// STACKWORLD - 우측 상점 패널
// 아이템 목록 + 타입 필터 + 구매/사용/장착 버튼
// ============================================================
import { useState, useEffect, useCallback } from "react";
import type { LogLine } from "@stack-world/shared";

interface ShopItem {
  item_key: string;
  item_type: string;
  name: string;
  description: string;
  price: number;
  max_level: number;
  rarity: string;
  effect_data: Record<string, unknown>;
  owned_level: number | null;
  owned_qty: number;
}

interface Props {
  statusData: Record<string, unknown>;
  activeRunId?: string;
  onLog: (logs: LogLine[]) => void;
  onRefreshStatus: () => Promise<void>;
}

type FilterTab = "all" | "upgrade" | "gear" | "consumable" | "skill" | "modifier" | "owned";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all",        label: "ALL"  },
  { key: "gear",       label: "GEAR" },
  { key: "upgrade",    label: "UPG"  },
  { key: "consumable", label: "ITEM" },
  { key: "skill",      label: "SKIL" },
  { key: "modifier",   label: "MOD"  },
  { key: "owned",      label: "MY"   },
];

const RARITY_LABEL: Record<string, string> = {
  common: "",
  rare: "[R]",
  epic: "[E]",
  legendary: "[L]",
};

const RARITY_COLOR: Record<string, string> = {
  common: "text-green-600",
  rare:   "text-blue-400",
  epic:   "text-purple-400",
  legendary: "text-yellow-400",
};

// 아이템별 효과 요약 텍스트
const EFFECT_TEXT: Record<string, string> = {
  UPG_CRIT_BOOST:       "CRIT 임계값 −2%/레벨 → 크리 확률 ↑",
  UPG_FUMBLE_SHIELD:    "FUMBLE 방어 −2%/레벨 → 펌블 확률 ↓",
  UPG_TIME_EFFICIENCY:  "work TIME 소모 −1/레벨",
  UPG_RISK_DAMPENER:    "RISK 사고 확률 −20%/레벨",
  UPG_XP_AMPLIFIER:     "XP 획득량 +10%/레벨",
  UPG_QUAL_BASELINE:    "런 시작 QUALITY +5/레벨",
  ITEM_COFFEE:          "TIME +20 즉시 · FLOW STATE 3턴",
  ITEM_RISK_SHIELD:     "RISK 사고차단 5회 work 동안",
  ITEM_ENERGY_DRINK:    "성공률 +5% 향상 · 3턴",
  ITEM_DEBUG_KIT:       "QUALITY +15 즉시",
  ITEM_REFACTOR_SCROLL: "DEBT −20 즉시",
  SKILL_REFACTOR:       "refactor 커맨드 해금 → DEBT −20 (쿨 5-work)",
  SKILL_CODE_REVIEW:    "code_review 해금 → RISK −15 · QUAL +5 (쿨 4-work)",
  MOD_SPEEDRUN:         "TIME 소모 ×1.5 · XP ×2.0 (런 1회 적용)",
  MOD_SAFE_MODE:        "성공률 +10% · XP ×0.8 (런 1회 적용)",
  MOD_CHALLENGE:        "CRIT↑ + FUMBLE↑ · XP ×2.5 (고위험 고보상)",
  // 장비 (치장 + 능력치)
  EQUIP_HEADPHONES:     "성공 work마다 QUALITY +2/레벨 → 코드 품질 지속 상승",
  EQUIP_MECH_KEYBOARD:  "성공 판정 임계값 −2%/레벨 → 성공률 영구 상승",
  EQUIP_DUAL_MONITOR:   "런 시작 TIME +8/레벨 → 초기 여유 시간 확보",
  EQUIP_HOODIE:         "런 시작 RISK −3/레벨 → 초기 RISK 낮게 시작",
  EQUIP_COFFEE_SETUP:   "work 1회마다 TIME +1 회복/레벨 → 지속 시간 보충",
};

function log(level: LogLine["level"], message: string): LogLine {
  return { timestamp: new Date().toISOString(), level, message };
}

export default function ShopPanel({ statusData, activeRunId, onLog, onRefreshStatus }: Props) {
  const char = statusData.character as Record<string, unknown> | undefined;
  const credits = Number(char?.credits ?? 0);

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      });
      if (res.ok) {
        const data = await res.json();
        const result = data?.result as Record<string, unknown> | undefined;
        setItems((result?.items ?? []) as ShopItem[]);
      }
    } catch {
      // 조용히 실패
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const isGearItem = (i: ShopItem) => i.item_key.startsWith("EQUIP_");

  const filtered = (() => {
    if (activeTab === "owned") {
      return items.filter((i) =>
        (i.item_type === "upgrade" && i.owned_level != null && i.owned_level > 0) ||
        (i.item_type !== "upgrade" && i.owned_qty > 0)
      );
    }
    if (activeTab === "gear")    return items.filter(isGearItem);
    if (activeTab === "upgrade") return items.filter((i) => i.item_type === "upgrade" && !isGearItem(i));
    if (activeTab === "all") return items;
    return items.filter((i) => i.item_type === activeTab);
  })();

  const handleAction = async (item: ShopItem, action: "buy" | "use" | "equip") => {
    const key = `${item.item_key}-${action}`;
    setProcessing(key);
    try {
      const body: Record<string, unknown> = { action, item_key: item.item_key };
      if (action === "buy") {
        body.idempotency_key = `${item.item_key}-${Date.now()}`;
      }
      const res = await fetch("/api/shop-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const result = data?.result as Record<string, unknown> | undefined;
      if (res.ok) {
        onLog([log("success", String(result?.message ?? `${action} 완료`))]);
        await fetchItems();
        await onRefreshStatus();
      } else {
        onLog([log("error", String(data?.error ?? `${action} 실패`))]);
      }
    } catch (e) {
      onLog([log("error", `오류: ${e instanceof Error ? e.message : String(e)}`)]);
    } finally {
      setProcessing(null);
    }
  };

  const ownedCount = items.filter((i) =>
    (i.item_type === "upgrade" && i.owned_level != null && i.owned_level > 0) ||
    (i.item_type !== "upgrade" && i.owned_qty > 0)
  ).length;

  return (
    <div className="p-2 text-xs font-mono space-y-2">
      {/* 크레딧 헤더 */}
      <div className="flex items-center justify-between border-b border-green-900 pb-1">
        <span className="text-green-600">── SHOP ──</span>
        <span className="text-green-400">{credits}cr</span>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-0.5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-0.5 text-[9px] font-mono border transition-colors ${
              activeTab === tab.key
                ? "border-green-500 text-green-300 bg-green-950"
                : "border-green-900 text-green-700 hover:text-green-500 hover:border-green-700"
            }`}
          >
            {tab.label}
            {tab.key === "owned" && ownedCount > 0 && (
              <span className="ml-0.5 text-green-600">{ownedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* 아이템 목록 */}
      {loading ? (
        <div className="text-green-800 text-center py-4">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-green-800 text-center py-4">
          {activeTab === "owned" ? "보유 아이템 없음" : "아이템 없음"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((item) => (
            <ItemCard
              key={item.item_key}
              item={item}
              credits={credits}
              activeRunId={activeRunId}
              processing={processing}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────── 아이템 카드 ────────────

function ItemCard({
  item,
  credits,
  activeRunId,
  processing,
  onAction,
}: {
  item: ShopItem;
  credits: number;
  activeRunId?: string;
  processing: string | null;
  onAction: (item: ShopItem, action: "buy" | "use" | "equip") => void;
}) {
  const isMaxed = item.item_type === "upgrade" && item.owned_level != null && item.owned_level >= item.max_level;
  const isOwned = item.item_type === "skill" && item.owned_level != null;

  // 업그레이드: 다음 레벨 가격 = price * 1.1^ownedLevel
  const ownedLevel = item.owned_level ?? 0;
  const nextPrice = item.item_type === "upgrade"
    ? Math.round(item.price * Math.pow(1.1, ownedLevel))
    : item.price;

  const canBuy = (() => {
    if (item.item_type === "upgrade")    return !isMaxed && credits >= nextPrice;
    if (item.item_type === "consumable") return credits >= item.price;
    if (item.item_type === "skill")      return !isOwned && credits >= item.price;
    if (item.item_type === "modifier")   return credits >= item.price;
    return false;
  })();

  const canUse   = item.item_type === "consumable" && item.owned_qty > 0 && !!activeRunId;
  const canEquip = item.item_type === "modifier"   && item.owned_qty > 0;

  const isBuying  = processing === `${item.item_key}-buy`;
  const isUsing   = processing === `${item.item_key}-use`;
  const isEquip   = processing === `${item.item_key}-equip`;
  const anyBusy   = processing !== null;

  // 소유 표시
  const ownedLabel = (() => {
    if (item.item_type === "upgrade") {
      if (item.owned_level != null) return `Lv.${item.owned_level}/${item.max_level}`;
      return `Lv.0/${item.max_level}`;
    }
    if (item.owned_qty > 0) return `×${item.owned_qty}`;
    return null;
  })();

  const rarityTag   = RARITY_LABEL[item.rarity] ?? "";
  const rarityColor = RARITY_COLOR[item.rarity] ?? "text-green-600";
  const effectText  = EFFECT_TEXT[item.item_key];

  return (
    <div className="border border-green-900 p-1.5 space-y-1">
      {/* 첫째 줄: 이름 + 레어리티 + 소유 */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-green-300 truncate flex-1">{item.name}</span>
        <span className="flex items-center gap-1 shrink-0">
          {rarityTag && <span className={`text-[9px] ${rarityColor}`}>{rarityTag}</span>}
          {ownedLabel && (
            <span className={`text-[9px] ${isMaxed ? "text-yellow-500" : "text-green-500 font-bold"}`}>
              {ownedLabel}
            </span>
          )}
        </span>
      </div>

      {/* 효과 요약 (item_key별 정의된 텍스트) */}
      {effectText && (
        <div className="text-[9px] text-green-500 leading-tight border-l border-green-800 pl-1">
          {effectText}
        </div>
      )}

      {/* 설명 */}
      <div className="text-green-800 text-[9px] leading-tight">
        {item.description.length > 60 ? `${item.description.slice(0, 60)}…` : item.description}
      </div>

      {/* 가격 + 버튼 */}
      <div className="flex items-center justify-end gap-1 pt-0.5">
        <span className="text-green-600 text-[10px] mr-auto">
          {isMaxed ? "MAX" : isOwned ? "소유" : `${nextPrice}cr`}
        </span>

        {/* 구매 버튼 */}
        {!isMaxed && !isOwned && (
          <ActionButton
            label={isBuying ? "..." : "구매"}
            disabled={!canBuy || anyBusy}
            onClick={() => onAction(item, "buy")}
          />
        )}

        {/* 사용 버튼 */}
        {item.item_type === "consumable" && item.owned_qty > 0 && (
          <ActionButton
            label={isUsing ? "..." : "사용"}
            disabled={!canUse || anyBusy}
            onClick={() => onAction(item, "use")}
            title={!activeRunId ? "런 진행 중에만 사용 가능" : undefined}
          />
        )}

        {/* 장착 버튼 */}
        {item.item_type === "modifier" && item.owned_qty > 0 && (
          <ActionButton
            label={isEquip ? "..." : "장착"}
            disabled={anyBusy}
            onClick={() => onAction(item, "equip")}
          />
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
  title,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-0.5 text-[10px] font-mono border transition-colors ${
        disabled
          ? "border-green-900 text-green-900 cursor-not-allowed"
          : "border-green-600 text-green-400 hover:border-green-400 hover:text-green-300 cursor-pointer"
      }`}
    >
      {label}
    </button>
  );
}
