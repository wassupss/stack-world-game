"use client";

// ============================================================
// STACKWORLD - 레이드 채팅 패널
// NOW PLAYING 패널 하단에 표시되는 실시간 채팅 UI
// ============================================================
import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  character_name: string;
  message: string;
  timestamp: string;
}

interface Props {
  messages: ChatMessage[];
  myName: string;
  onSend: (msg: string) => void;
  disabled?: boolean;
}

export default function RaidChatPanel({ messages, myName, onSend, disabled }: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = draft.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 min-h-0">
        {messages.length === 0 && (
          <div className="text-green-900 text-[10px] text-center py-3 font-mono">
            채팅 없음
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.character_name === myName;
          const time  = msg.timestamp.split("T")[1]?.slice(0, 5) ?? "";
          return (
            <div key={msg.id} className="font-mono text-[10px] leading-relaxed">
              <span className="text-green-900 select-none mr-1">{time}</span>
              <span className={isOwn ? "text-green-400 font-bold" : "text-green-600"}>
                {msg.character_name}
              </span>
              <span className="text-green-800 mx-0.5">:</span>
              <span className={isOwn ? "text-green-200" : "text-green-400"}>
                {msg.message}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 채팅 입력 */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-green-900 flex items-center gap-1 px-2 py-1"
      >
        <span className="text-green-700 text-[10px] font-mono shrink-0 select-none">say›</span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="메시지..."
          disabled={disabled}
          maxLength={200}
          className="flex-1 bg-transparent text-green-300 text-[10px] font-mono outline-none placeholder-green-900 min-w-0"
        />
      </form>
    </div>
  );
}
