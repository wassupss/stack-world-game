"use client";

// ============================================================
// STACKWORLD - 커맨드 입력 컴포넌트
// 자동완성 + 히스토리 (↑↓) + 해금 커맨드 기반 필터링
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { getAutocompleteSuggestions } from "@/lib/commands/registry";
import type { QuickMode } from "@stack-world/shared";

interface Props {
  onSubmit: (command: string) => void;
  isProcessing: boolean;
  activeRunId?: string;
  activeRaidId?: string;
  quickMode?: QuickMode | null;
  onQuickModeExit?: () => void;
}

export default function CommandInput({ onSubmit, isProcessing, activeRunId, activeRaidId, quickMode, onQuickModeExit }: Props) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  // 히스토리 탐색 중엔 자동완성 억제
  const suppressAutocompleteRef = useRef(false);

  // 자동완성 업데이트 (히스토리 탐색 중엔 스킵)
  useEffect(() => {
    if (suppressAutocompleteRef.current) {
      suppressAutocompleteRef.current = false;
      setSuggestions([]);
      return;
    }
    if (input.trim().length > 0) {
      const sug = getAutocompleteSuggestions(input);
      setSuggestions(sug);
      setSelectedSuggestion(-1);
    } else {
      setSuggestions([]);
    }
  }, [input]);

  // 선택된 자동완성 항목이 보이도록 스크롤
  useEffect(() => {
    if (!suggestionsRef.current || selectedSuggestion < 0) return;
    const items = suggestionsRef.current.querySelectorAll<HTMLElement>(".autocomplete-item");
    const item = items[selectedSuggestion];
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [selectedSuggestion]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // QuickMode: 빈 입력 + 단축키 → 즉시 커맨드 제출
      if (quickMode && !isProcessing && input === "") {
        const key = e.key.toUpperCase();
        const mapped = quickMode.map[e.key] ?? quickMode.map[key];
        if (mapped) {
          e.preventDefault();
          onQuickModeExit?.();
          setHistory((prev) => [mapped, ...prev.slice(0, 99)]);
          setHistoryIdx(-1);
          setSuggestions([]);
          onSubmit(mapped);
          return;
        }
        // ESC: quickMode 해제
        if (e.key === "Escape") {
          e.preventDefault();
          onQuickModeExit?.();
          setSuggestions([]);
          return;
        }
      }

      // 위 화살표: 자동완성 탐색 or 히스토리
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestion((prev) => Math.max(0, prev - 1));
        } else {
          const newIdx = Math.min(historyIdx + 1, history.length - 1);
          setHistoryIdx(newIdx);
          if (history[newIdx] !== undefined) {
            suppressAutocompleteRef.current = true;
            setInput(history[newIdx]);
          }
        }
        return;
      }

      // 아래 화살표: 자동완성 탐색 or 히스토리
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestion((prev) => Math.min(suggestions.length - 1, prev + 1));
        } else if (historyIdx > 0) {
          const newIdx = historyIdx - 1;
          setHistoryIdx(newIdx);
          suppressAutocompleteRef.current = true;
          setInput(history[newIdx] ?? "");
        } else if (historyIdx === 0) {
          setHistoryIdx(-1);
          suppressAutocompleteRef.current = true;
          setInput("");
        }
        return;
      }

      // Tab: 자동완성 적용
      if (e.key === "Tab") {
        e.preventDefault();
        const sug = selectedSuggestion >= 0 ? suggestions[selectedSuggestion] : suggestions[0];
        if (sug) {
          const firstWord = sug.split(" ")[0];
          setInput(firstWord + " ");
          setSuggestions([]);
        }
        return;
      }

      // Escape: 자동완성 닫기
      if (e.key === "Escape") {
        setSuggestions([]);
        setSelectedSuggestion(-1);
        return;
      }

      // Enter: 커맨드 제출
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
          const sug = suggestions[selectedSuggestion];
          setInput(sug.split(" ")[0] + " ");
          setSuggestions([]);
          setSelectedSuggestion(-1);
          return;
        }
        const cmd = input.trim();
        if (!cmd || isProcessing) return;
        setHistory((prev) => [cmd, ...prev.slice(0, 99)]);
        setHistoryIdx(-1);
        setInput("");
        setSuggestions([]);
        onSubmit(cmd);
        return;
      }

      // Ctrl+L: clear
      if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        onSubmit("clear");
        return;
      }
    },
    [input, history, historyIdx, suggestions, selectedSuggestion, isProcessing, onSubmit, quickMode, onQuickModeExit],
  );

  // 항상 입력창 포커스 유지
  useEffect(() => {
    const handleClick = () => inputRef.current?.focus();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const contextHint = activeRaidId
    ? "[RAID]"
    : activeRunId
    ? "[RUN]"
    : "[IDLE]";

  return (
    <div className="relative">
      {/* QuickMode 힌트 바 */}
      {quickMode && (
        <div className="px-3 py-1 bg-green-950/60 border-b border-green-900 flex items-center gap-3">
          <span className="text-yellow-500 text-[10px] font-mono font-bold shrink-0">⚡ QUICK</span>
          <span className="text-green-400 text-[10px] font-mono flex-1">{quickMode.hint}</span>
          <span className="text-green-800 text-[10px] font-mono shrink-0">ESC: 취소</span>
        </div>
      )}

      {/* 자동완성 드롭다운 */}
      {suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 bg-black border border-green-900 max-h-40 overflow-y-auto z-10"
        >
          {suggestions.map((sug, i) => (
            <div
              key={i}
              className={`autocomplete-item text-xs${i === selectedSuggestion ? " selected" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                setInput(sug.split(" ")[0] + " ");
                setSuggestions([]);
                inputRef.current?.focus();
              }}
            >
              {sug}
            </div>
          ))}
        </div>
      )}

      {/* 입력줄 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black">
        <span className="text-green-600 text-xs shrink-0 select-none">
          {contextHint}
        </span>
        <span className="text-green-500 text-xs select-none">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setHistoryIdx(-1);
          }}
          onKeyDown={handleKeyDown}
          readOnly={isProcessing}
          className={`flex-1 bg-transparent text-xs outline-none caret-green-400 placeholder-green-900 ${
            isProcessing ? "text-green-700 cursor-wait" : "text-green-400"
          }`}
          placeholder={
            isProcessing
              ? "처리 중..."
              : quickMode
              ? `단축키 입력 또는 커맨드 직접 입력...`
              : "커맨드 입력 (Tab: 자동완성, ↑↓: 히스토리)"
          }
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {isProcessing && (
          <span className="text-green-600 text-xs animate-pulse shrink-0">●</span>
        )}
      </div>
    </div>
  );
}
