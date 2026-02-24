"use client";

// ============================================================
// STACKWORLD - 로그 패널 (인터랙티브 + 애니메이션 지원)
// ============================================================
import { useEffect, useRef, useState } from "react";
import type { LogLine, InteractiveItem } from "@stack-world/shared";

interface Props {
  logs: LogLine[];
  onCommand: (cmd: string) => void;
  scrollTrigger: number; // 증가할 때마다 강제 스크롤
}

const LEVEL_CLASS: Partial<Record<string, string>> = {
  info: "text-green-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  success: "text-green-300 font-bold",
  system: "text-green-700 italic",
  ascii: "text-green-500",
};

export default function LogPanel({ logs, onCommand, scrollTrigger }: Props) {
  const bottomRef     = useRef<HTMLDivElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 커맨드 실행 후 강제 스크롤 (클릭·키보드 모두 커버)
  useEffect(() => {
    if (scrollTrigger > 0) scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTrigger]);

  // 로그 추가 시 자동 스크롤 (하단 근처일 때만 — 레이드 실시간 이벤트 등)
  useEffect(() => {
    if (isAtBottomRef.current) scrollToBottom();
  }, [logs]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed"
    >
      {logs.map((log, i) => (
        <LogEntry key={i} log={log} onCommand={onCommand} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function LogEntry({ log, onCommand }: { log: LogLine; onCommand: (cmd: string) => void }) {
  const time = log.timestamp.split("T")[1]?.slice(0, 8) ?? "";

  if (log.level === "ascii") {
    return (
      <div className="text-green-500">
        <span className="whitespace-pre select-none">{log.message}</span>
      </div>
    );
  }

  if (log.level === "interactive") {
    return <InteractiveEntry log={log} onCommand={onCommand} />;
  }

  if (log.level === "roll") {
    return <AnimatedRollEntry log={log} time={time} />;
  }

  const cls = LEVEL_CLASS[log.level] ?? "text-green-400";
  return (
    <div className={`flex gap-2 ${cls}`}>
      <span className="text-green-900 shrink-0 select-none">{time}</span>
      <span className="break-all whitespace-pre-wrap">{log.message}</span>
    </div>
  );
}

// ──────────── 인터랙티브 엔트리 ────────────

function InteractiveEntry({ log, onCommand }: { log: LogLine; onCommand: (cmd: string) => void }) {
  const type  = log.data?.type as string | undefined;
  const items = (log.data?.items ?? []) as InteractiveItem[];
  const [used, setUsed] = useState(false);

  const handleClick = (cmd: string) => {
    if (used) return;
    setUsed(true);
    onCommand(cmd);
  };

  if (type === "choices") {
    return (
      <div className="my-1 space-y-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => handleClick(item.command)}
            disabled={used}
            className={`block w-full text-left px-3 py-1 text-xs font-mono border transition-colors
              ${used
                ? "border-green-900 text-green-800 cursor-not-allowed"
                : "border-green-700 text-green-300 hover:bg-green-900/40 hover:border-green-500 cursor-pointer active:bg-green-800/60"
              }`}
          >
            <span className="text-green-600 select-none mr-2">[{item.key ?? i}]</span>
            {item.label}
            {item.meta && <span className="text-green-700 ml-2 text-[10px]">{item.meta}</span>}
          </button>
        ))}
        {used && (
          <div className="text-green-900 text-[10px] px-1">선택 완료</div>
        )}
      </div>
    );
  }

  if (type === "cards") {
    const labels = ["A", "B", "C"];
    return (
      <div className="my-1 flex gap-2 flex-wrap">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => handleClick(item.command)}
            disabled={used}
            className={`text-left px-3 py-2 text-xs font-mono border transition-colors min-w-[160px]
              ${used
                ? "border-green-900 text-green-800 cursor-not-allowed"
                : "border-green-600 text-green-400 hover:bg-green-900/40 hover:border-green-400 cursor-pointer active:bg-green-800/60"
              }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-500 font-bold">[{labels[i] ?? i}]</span>
              {item.badge && (
                <span className="text-[10px] px-1 border border-green-700 text-green-600">
                  {item.badge}
                </span>
              )}
            </div>
            <div className="text-green-300 text-[11px] leading-tight">{item.label}</div>
            {item.meta && (
              <div className="text-green-700 text-[10px] mt-1 whitespace-pre">{item.meta}</div>
            )}
          </button>
        ))}
        {used && (
          <div className="text-green-900 text-[10px] self-end pb-2">선택 완료</div>
        )}
      </div>
    );
  }

  // fallback: render as text
  return (
    <div className="flex gap-2 text-green-400">
      <span className="text-green-900 shrink-0 select-none">{log.timestamp.split("T")[1]?.slice(0, 8) ?? ""}</span>
      <span>{log.message}</span>
    </div>
  );
}

// ──────────── 애니메이션 다이스 롤 ────────────

function AnimatedRollEntry({ log, time }: { log: LogLine; time: string }) {
  const data = log.data as {
    roll: number;
    threshold: number;
    isCritical: boolean;
    isFumble: boolean;
    isSuccess: boolean;
  } | undefined;

  const [animFrame, setAnimFrame] = useState(0);
  const [done, setDone] = useState(false);
  const TOTAL_FRAMES = 7;

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      setAnimFrame(frame);
      if (frame >= TOTAL_FRAMES) {
        clearInterval(interval);
        setDone(true);
      }
    }, 70);
    return () => clearInterval(interval);
  }, []);

  const width = 20;
  const roll = data?.roll ?? 0;
  const threshold = data?.threshold ?? 0;

  const makeBar = (markerPos: number) => {
    const chars: string[] = Array.from({ length: width }, () => "─");
    const threshPos = Math.min(width - 1, Math.floor(threshold * width));
    chars[threshPos] = "|";
    chars[Math.min(width - 1, markerPos)] = "▲";
    return chars.join("");
  };

  const finalPos = Math.min(width - 1, Math.floor(roll * width));
  // Animation: marker bounces, converging on final position
  const animPos = done
    ? finalPos
    : Math.round(Math.abs(Math.sin((animFrame / TOTAL_FRAMES) * Math.PI * 3)) * (width - 1));

  const outcome = data?.isCritical ? "CRITICAL" : data?.isFumble ? "FUMBLE" : data?.isSuccess ? "SUCCESS" : "FAIL";
  const outcomeColor = data?.isCritical
    ? "text-yellow-300 font-bold"
    : data?.isFumble
    ? "text-red-400 font-bold"
    : data?.isSuccess
    ? "text-green-300"
    : "text-yellow-400";

  return (
    <div className={`flex gap-2 font-mono text-xs ${done ? outcomeColor : "text-green-600"}`}>
      <span className="text-green-900 shrink-0 select-none">{time}</span>
      <span>
        DICE&nbsp;&nbsp;[{makeBar(animPos)}]&nbsp;&nbsp;
        {done
          ? `${roll.toFixed(3)} vs ${threshold.toFixed(3)} → ${outcome}`
          : "ROLLING..."}
      </span>
    </div>
  );
}
