"use client";

// ============================================================
// STACKWORLD - 메인 터미널 쉘 컴포넌트
// ============================================================
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogPanel from "./LogPanel";
import StatusPanel from "./StatusPanel";
import ContentPanel from "./ContentPanel";
import ShopPanel from "./ShopPanel";
import CommandInput from "./CommandInput";
import { parseCommand } from "@/lib/commands/parser";
import { executeCommand } from "@/lib/commands/executor";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRaidRealtime } from "@/lib/hooks/useRaidRealtime";
import type { LogLine, QuickMode } from "@stack-world/shared";

interface Props {
  character: { id: string; name: string; credits: number };
  positionMastery: Array<{ position: string; level: number; xp: number }>;
  coreMastery: Array<{ core: string; level: number; xp: number }>;
}

export default function TerminalShell({ character, positionMastery, coreMastery }: Props) {
  const router = useRouter();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    setClock(fmt());
    const timer = setInterval(() => setClock(fmt()), 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date().toISOString();
  const [logs, setLogs] = useState<LogLine[]>([
    { timestamp: now, level: "ascii", message: " _____ _____ _____ _____ _   _ _ _ _____  _____  _     ____" },
    { timestamp: now, level: "ascii", message: "/  ___|_   _|  _  /  __ \\ | | | | |  _  ||  __ \\| |   |  _ \\" },
    { timestamp: now, level: "ascii", message: "\\ `--.  | | | | | | /  \\/ | | | | | | | || |__/ /| |   | | | |" },
    { timestamp: now, level: "ascii", message: " `--. \\ | | | | | | |   | '_' | | | | | ||    / | |   | | | |" },
    { timestamp: now, level: "ascii", message: "/\\__/ / | | \\ \\_/ / \\__/\\| ._. | | \\ \\_/ /| |\\ \\ | |___| |_/ /" },
    { timestamp: now, level: "ascii", message: "\\____/  \\_/  \\___/ \\____/\\_| |_/_/  \\___/ \\_| \\_\\_____/____/" },
    { timestamp: now, level: "system", message: "────────────────────────────────────────────────────────────" },
    { timestamp: now, level: "system", message: "STACKWORLD v0.1.0  |  터미널 기반 협동/경쟁 개발자 RPG" },
    { timestamp: now, level: "system", message: `환영합니다, ${character.name}. 'help'로 커맨드 목록을 확인하세요.` },
    { timestamp: now, level: "info",   message: `크레딧: ${character.credits}cr` },
  ]);

  const [activeRunId, setActiveRunId] = useState<string | undefined>();
  const [activeRaidId, setActiveRaidId] = useState<string | undefined>();
  const [statusData, setStatusData] = useState<Record<string, unknown>>({
    character,
    positionMastery,
    coreMastery,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickMode, setQuickMode] = useState<QuickMode | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<"status" | "shop">("status");
  const [scrollTrigger, setScrollTrigger] = useState(0);

  const supabase = createBrowserClient();

  const addLog = useCallback((log: LogLine) => {
    setLogs((prev) => [...prev.slice(-500), log]);
  }, []);

  const addLogs = useCallback((newLogs: LogLine[]) => {
    setLogs((prev) => [...prev.slice(-500 + newLogs.length), ...newLogs]);
  }, []);

  // 상태 새로고침 (StatusPanel + ContentPanel 동기화)
  const refreshState = useCallback(async () => {
    const res = await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status" }),
    });
    if (res.ok) {
      const data = await res.json();
      setStatusData((prev) => ({ ...prev, ...data }));
      if (data.active_run?.id) setActiveRunId(data.active_run.id);
      else setActiveRunId(undefined);
      if (data.active_raid?.id) setActiveRaidId(data.active_raid.id);
      else setActiveRaidId(undefined);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const { isConnected: isRaidConnected } = useRaidRealtime(activeRaidId, addLog, refreshState);

  const handleCommand = useCallback(
    async (input: string) => {
      if (isProcessing) return;
      if (!input.trim()) return;

      // QuickMode 해제
      setQuickMode(null);

      addLog({
        timestamp: new Date().toISOString(),
        level: "info",
        message: `$ ${input}`,
      });

      if (input.trim() === "logout") {
        addLog({ timestamp: new Date().toISOString(), level: "system", message: "세션을 종료합니다..." });
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      const parsed = parseCommand(input);
      if (!parsed) return;

      setIsProcessing(true);
      try {
        const result = await executeCommand(parsed, {
          supabase: supabase as Parameters<typeof executeCommand>[1]["supabase"],
          characterId: character.id,
          activeRunId,
          activeRaidId,
          onStateUpdate: refreshState,
        });

        addLogs(result.logs);
        setScrollTrigger((n) => n + 1);

        // QuickMode 설정 (event/draw 후 단축 입력 모드)
        if (result.quickMode) {
          setQuickMode(result.quickMode);
        }

        // SHOP 패널 자동 전환
        if (result.data?.openShop) {
          setRightPanelMode("shop");
        }

        // 자원 변경 커맨드 후 StatusPanel 자동 갱신
        if (result.autoRefresh) {
          await refreshState();
        }
      } catch (e) {
        addLog({
          timestamp: new Date().toISOString(),
          level: "error",
          message: `오류: ${e instanceof Error ? e.message : String(e)}`,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, addLog, addLogs, supabase, character.id, activeRunId, activeRaidId, refreshState, router],
  );

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-green-900 text-xs text-green-600">
        <span>STACKWORLD v0.1.0</span>
        <span>{character.name} | {character.credits}cr</span>
        <span className="flex items-center gap-2">
          {activeRaidId && (
            <span className={`${isRaidConnected ? "text-green-400" : "text-yellow-600"}`}>
              {isRaidConnected ? "● RAID LIVE" : "○ RAID CONNECTING..."}
            </span>
          )}
          <span suppressHydrationWarning>{clock}</span>
        </span>
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 로그 패널 */}
        <div className="flex-1 overflow-hidden border-r border-green-900">
          <LogPanel logs={logs} onCommand={handleCommand} scrollTrigger={scrollTrigger} />
        </div>

        {/* 컨텐츠 패널 (활성 런/레이드/파티 대기 시에만 표시) */}
        {(activeRunId || activeRaidId || !!statusData.party_info) && (
          <div className="w-64 flex flex-col border-l border-green-900 overflow-hidden">
            <div className="text-[10px] font-mono text-green-800 px-3 py-1 border-b border-green-900 shrink-0">
              ── NOW PLAYING ──
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <ContentPanel
                statusData={statusData}
                activeRunId={activeRunId}
                activeRaidId={activeRaidId}
              />
            </div>
          </div>
        )}

        {/* 우측 패널 */}
        <div className="w-72 flex flex-col border-l border-green-900 overflow-hidden">
          {/* 탭 바 */}
          <div className="flex border-b border-green-900 shrink-0">
            <PanelTab label="STATUS" active={rightPanelMode === "status"} onClick={() => setRightPanelMode("status")} />
            <PanelTab label="SHOP"   active={rightPanelMode === "shop"}   onClick={() => setRightPanelMode("shop")} />
          </div>
          {/* 내용 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {rightPanelMode === "status" ? (
              <StatusPanel statusData={statusData} />
            ) : (
              <ShopPanel
                statusData={statusData}
                activeRunId={activeRunId}
                onLog={addLogs}
                onRefreshStatus={refreshState}
              />
            )}
          </div>
        </div>
      </div>

      {/* 커맨드 입력 */}
      <div className="border-t border-green-900">
        <CommandInput
          onSubmit={handleCommand}
          isProcessing={isProcessing}
          activeRunId={activeRunId}
          activeRaidId={activeRaidId}
          quickMode={quickMode}
          onQuickModeExit={() => setQuickMode(null)}
        />
      </div>
    </div>
  );
}

function PanelTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-1 text-[10px] font-mono border-b-2 transition-colors ${
        active
          ? "text-green-300 border-green-500"
          : "text-green-700 border-transparent hover:text-green-500"
      }`}
    >
      {label}
    </button>
  );
}
