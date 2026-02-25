"use client";

// ============================================================
// STACKWORLD - Realtime 훅
// raid_events 테이블 변경 구독 (Free tier: 이것만 Realtime 사용)
// ============================================================
import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { LogLine } from "@stack-world/shared";
import type { ChatMessage } from "@/components/terminal/RaidChatPanel";

// 레이드 종료 이벤트 타입 (이 이벤트 수신 시 refreshState 호출)
// ※ raid_victory 는 제외 — executor.ts에서 party_leave await 후 autoRefresh로 처리
//   Realtime에서 party_leave 전에 refreshState를 호출하면 party_info가 복원되는 race condition 발생
const RAID_END_EVENTS = new Set(["raid_timeout", "raid_abandoned", "raid_resolved"]);

interface RaidEvent {
  id: string;
  raid_id: string;
  type: string;
  payload: Record<string, unknown>;
  actor_id?: string;
  created_at: string;
}

export function useRaidRealtime(
  raidId: string | undefined,
  onEvent: (log: LogLine) => void,
  onRaidEnd?: () => void,    // 레이드 종료 이벤트 수신 시 콜백
  onChat?: (msg: ChatMessage) => void, // 채팅 메시지 수신 시 콜백
) {
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createBrowserClient();

  const handleEvent = useCallback(
    (event: RaidEvent) => {
      // 채팅 이벤트는 onChat으로 분리 (게임 로그에는 표시 안 함)
      if (event.type === "raid_chat") {
        const payload = event.payload as { character_name?: string; message?: string };
        onChat?.({
          id: event.id,
          character_name: payload.character_name ?? "???",
          message: payload.message ?? "",
          timestamp: event.created_at,
        });
        return;
      }

      const timestamp = new Date().toISOString();
      const typeLabel = formatEventType(event.type);
      onEvent({
        timestamp,
        level: getEventLevel(event.type),
        message: `[레이드] ${typeLabel}: ${formatPayload(event.payload)}`,
        data: event.payload,
      });

      // 레이드 종료 이벤트 → ContentPanel + StatusPanel 갱신
      if (RAID_END_EVENTS.has(event.type)) {
        onRaidEnd?.();
      }
    },
    [onEvent, onRaidEnd, onChat],
  );

  useEffect(() => {
    if (!raidId) return;

    const channel = supabase
      .channel(`raid:${raidId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "raid_events",
          filter: `raid_id=eq.${raidId}`,
        },
        (payload) => {
          handleEvent(payload.new as RaidEvent);
        },
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [raidId, supabase, handleEvent]);

  return { isConnected };
}

function formatEventType(type: string): string {
  const labels: Record<string, string> = {
    raid_start:    "레이드 시작",
    action_result: "액션 실행",
    raid_victory:  "레이드 승리 ★",
    raid_timeout:  "시간 초과",
    raid_resolved: "레이드 종료",
    raid_abandoned:"레이드 포기",
  };
  return labels[type] ?? type;
}

function getEventLevel(type: string): LogLine["level"] {
  if (type === "raid_victory")  return "success";
  if (type === "raid_timeout")  return "error";
  if (type === "raid_abandoned") return "warn";
  if (type === "action_result") return "info";
  return "system";
}

function formatPayload(payload: Record<string, unknown>): string {
  if (payload.kpi_after) {
    const kpi = payload.kpi_after as Record<string, number>;
    return `에러율=${kpi.error_rate?.toFixed(1)}% 성공률=${kpi.success_rate?.toFixed(1)}%`;
  }
  if (payload.message) return String(payload.message);
  return JSON.stringify(payload).slice(0, 80);
}
