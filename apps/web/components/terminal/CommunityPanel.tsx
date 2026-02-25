"use client";

// ============================================================
// STACKWORLD - 커뮤니티 패널
// CHAT (전역) / FRIENDS (친구 목록 + DM)
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { useCommunityRealtime } from "@/lib/hooks/useCommunityRealtime";
import type { CommunityMessage, DirectMessage } from "@/lib/hooks/useCommunityRealtime";

interface Friend {
  id: string;
  character_id: string;
  name: string;
}

interface FriendRequest {
  id: string;
  character_id: string;
  name: string;
}

interface DmMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  is_mine: boolean;
}

interface Props {
  myName: string;
  myCharacterId: string;
}

export default function CommunityPanel({ myName, myCharacterId }: Props) {
  const [tab, setTab] = useState<"chat" | "friends">("chat");

  // ──────────── Global Chat ────────────
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef(tab);
  useEffect(() => { tabRef.current = tab; }, [tab]);

  const handleNewGlobalMessage = useCallback((msg: CommunityMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev.slice(-300), msg];
    });
    if (tabRef.current !== "chat") setUnread((n) => n + 1);
  }, []);

  // ──────────── Friends ────────────
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendInput, setFriendInput] = useState("");
  const [friendFeedback, setFriendFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [newRequestIds, setNewRequestIds] = useState<Set<string>>(new Set());

  // ──────────── DM ────────────
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [dmDraft, setDmDraft] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);
  // 친구별 안 읽은 DM 수
  const [unreadDms, setUnreadDms] = useState<Record<string, number>>({});
  const dmBottomRef = useRef<HTMLDivElement>(null);
  const selectedFriendRef = useRef(selectedFriend);
  useEffect(() => { selectedFriendRef.current = selectedFriend; }, [selectedFriend]);

  // DM 수신 콜백
  const handleNewDm = useCallback((msg: DirectMessage) => {
    const senderId = msg.sender_id;
    // 현재 선택된 친구와의 대화면 바로 표시
    if (selectedFriendRef.current?.character_id === senderId) {
      setDmMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, is_mine: false }];
      });
    } else {
      // 미선택 친구 → 미읽음 카운트 증가
      setUnreadDms((prev) => ({ ...prev, [senderId]: (prev[senderId] ?? 0) + 1 }));
    }
  }, []);

  // 친구 요청 수신 콜백 (realtime) — character_id만 옴, 이름은 friend_list 재조회로 반영
  const handleFriendRequest = useCallback(() => {
    loadFriends();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useCommunityRealtime(handleNewGlobalMessage, {
    myCharacterId,
    onDirectMessage: handleNewDm,
    onFriendRequest: handleFriendRequest,
  });

  // 최근 전역 채팅 로드
  useEffect(() => {
    fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "recent" }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setMessages(d.messages); });
  }, []);

  // 전역 채팅 자동 스크롤
  useEffect(() => {
    if (tab === "chat") chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  const handleGlobalSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = draft.trim();
    if (!msg || sending) return;
    setSending(true);
    setDraft("");
    await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "chat", message: msg }),
    });
    setSending(false);
  };

  // ──────────── Friends 로드 ────────────
  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "friend_list" }),
    });
    const d = await res.json();
    if (d.ok) {
      setFriends(d.friends);
      setRequests((prev) => {
        // 새로 추가된 요청 id 추적 (실시간 알림 하이라이트)
        const prevIds = new Set(prev.map((r) => r.character_id));
        const added = (d.requests as FriendRequest[]).filter((r) => !prevIds.has(r.character_id));
        if (added.length > 0) {
          setNewRequestIds((s) => {
            const next = new Set(s);
            added.forEach((r) => next.add(r.character_id));
            return next;
          });
        }
        return d.requests;
      });
    }
    setFriendsLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "friends") loadFriends();
  }, [tab, loadFriends]);

  const friendAction = useCallback(async (action: string, name: string) => {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, name }),
    });
    const d = await res.json();
    setFriendFeedback({ type: d.ok ? "ok" : "err", text: d.message ?? d.error ?? "오류" });
    setTimeout(() => setFriendFeedback(null), 3000);
    if (d.ok) loadFriends();
  }, [loadFriends]);

  // ──────────── DM 로드 ────────────
  const loadDmHistory = useCallback(async (friendCharacterId: string) => {
    setDmLoading(true);
    setDmMessages([]);
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dm_history", character_id: friendCharacterId }),
    });
    const d = await res.json();
    if (d.ok) setDmMessages(d.messages);
    setDmLoading(false);
  }, []);

  const openDm = useCallback((friend: Friend) => {
    setSelectedFriend(friend);
    setUnreadDms((prev) => ({ ...prev, [friend.character_id]: 0 }));
    loadDmHistory(friend.character_id);
  }, [loadDmHistory]);

  // DM 자동 스크롤
  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages]);

  const handleDmSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend || !dmDraft.trim() || dmSending) return;
    const msg = dmDraft.trim();
    setDmSending(true);
    setDmDraft("");
    // 낙관적 업데이트
    const optimistic: DmMessage = {
      id: `opt-${Date.now()}`,
      sender_id: myCharacterId,
      sender_name: myName,
      message: msg,
      created_at: new Date().toISOString(),
      is_mine: true,
    };
    setDmMessages((prev) => [...prev, optimistic]);

    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dm_send", name: selectedFriend.name, message: msg }),
    });
    const d = await res.json();
    if (!d.ok) {
      // 낙관적 메시지 롤백
      setDmMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setFriendFeedback({ type: "err", text: d.error ?? "전송 실패" });
      setTimeout(() => setFriendFeedback(null), 3000);
    }
    setDmSending(false);
  };

  // ──────────── Render ────────────
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 서브 탭 */}
      <div className="flex border-b border-green-900 shrink-0">
        <button
          onClick={() => { setTab("chat"); setUnread(0); }}
          className={`flex-1 py-1 text-[10px] font-mono border-b-2 transition-colors relative ${
            tab === "chat"
              ? "text-green-300 border-green-500"
              : "text-green-800 border-transparent hover:text-green-600"
          }`}
        >
          CHAT
          {unread > 0 && tab !== "chat" && (
            <span className="absolute top-0.5 right-1 text-[8px] text-yellow-500 font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
        <button
          onClick={() => { setTab("friends"); setNewRequestIds(new Set()); }}
          className={`flex-1 py-1 text-[10px] font-mono border-b-2 transition-colors relative ${
            tab === "friends"
              ? "text-green-300 border-green-500"
              : "text-green-800 border-transparent hover:text-green-600"
          }`}
        >
          FRIENDS
          {(requests.length > 0 || Object.values(unreadDms).some((n) => n > 0)) && (
            <span className="absolute top-0.5 right-1 text-[8px] text-yellow-500 font-bold">
              {requests.length + Object.values(unreadDms).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </div>

      {/* ── CHAT 탭 ── */}
      {tab === "chat" && (
        <>
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 min-h-0">
            {messages.length === 0 && (
              <div className="text-green-900 text-[10px] text-center py-4 font-mono">채팅 없음</div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.character_name === myName;
              const time = msg.created_at.split("T")[1]?.slice(0, 5) ?? "";
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
            <div ref={chatBottomRef} />
          </div>
          <form
            onSubmit={handleGlobalSend}
            className="shrink-0 border-t border-green-900 flex items-center gap-1 px-2 py-1"
          >
            <span className="text-green-700 text-[10px] font-mono shrink-0 select-none">›</span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="메시지 입력..."
              disabled={sending}
              maxLength={200}
              className="flex-1 bg-transparent text-green-300 text-[10px] font-mono outline-none placeholder-green-900 min-w-0"
            />
          </form>
        </>
      )}

      {/* ── FRIENDS 탭 ── */}
      {tab === "friends" && !selectedFriend && (
        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0 space-y-3">

          {/* 친구 추가 */}
          <div>
            <div className="text-green-800 text-[9px] font-mono mb-1 select-none">── 친구 추가 ──</div>
            <div className="flex gap-1">
              <input
                type="text"
                value={friendInput}
                onChange={(e) => setFriendInput(e.target.value)}
                placeholder="캐릭터명..."
                maxLength={30}
                className="flex-1 bg-transparent border border-green-900 text-green-300 text-[10px] font-mono px-1 py-0.5 outline-none placeholder-green-900 min-w-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (friendInput.trim()) {
                      friendAction("friend_add", friendInput.trim());
                      setFriendInput("");
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  if (friendInput.trim()) {
                    friendAction("friend_add", friendInput.trim());
                    setFriendInput("");
                  }
                }}
                className="text-green-700 hover:text-green-300 text-[10px] font-mono px-1.5 border border-green-900 hover:border-green-600 transition-colors"
              >
                +
              </button>
            </div>
            {friendFeedback && (
              <div className={`text-[9px] font-mono mt-1 ${
                friendFeedback.type === "ok" ? "text-green-400" : "text-red-400"
              }`}>
                {friendFeedback.text}
              </div>
            )}
          </div>

          {/* 받은 친구 요청 */}
          {requests.length > 0 && (
            <div>
              <div className="text-green-800 text-[9px] font-mono mb-1 select-none">
                ── 받은 요청 ({requests.length}) ──
              </div>
              {requests.map((req) => (
                <div
                  key={req.id}
                  className={`flex items-center justify-between py-0.5 ${
                    newRequestIds.has(req.character_id) ? "bg-yellow-900/10" : ""
                  }`}
                >
                  <span className="text-yellow-500 text-[10px] font-mono truncate max-w-[100px]">
                    {newRequestIds.has(req.character_id) && <span className="mr-1">●</span>}
                    {req.name}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => friendAction("friend_accept", req.name)}
                      className="text-[9px] font-mono text-green-600 hover:text-green-300 border border-green-900 hover:border-green-600 px-1 transition-colors"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => friendAction("friend_remove", req.name)}
                      className="text-[9px] font-mono text-green-900 hover:text-red-400 border border-green-900 hover:border-red-800 px-1 transition-colors"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 친구 목록 */}
          <div>
            <div className="text-green-800 text-[9px] font-mono mb-1 select-none">
              ── 친구 ({friends.length}) ──
            </div>
            {friendsLoading && (
              <div className="text-green-900 text-[10px] font-mono">로딩 중...</div>
            )}
            {!friendsLoading && friends.length === 0 && (
              <div className="text-green-900 text-[10px] font-mono">친구가 없습니다</div>
            )}
            {friends.map((f) => {
              const dm = unreadDms[f.character_id] ?? 0;
              return (
                <div key={f.id} className="flex items-center justify-between py-0.5 group">
                  <button
                    onClick={() => openDm(f)}
                    className="flex items-center gap-1 text-left flex-1 min-w-0"
                  >
                    <span className="text-green-600 text-[10px] font-mono">●</span>
                    <span className="text-green-400 text-[10px] font-mono truncate group-hover:text-green-200 transition-colors">
                      {f.name}
                    </span>
                    {dm > 0 && (
                      <span className="text-[8px] font-bold text-yellow-500 shrink-0">
                        [{dm}]
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => friendAction("friend_remove", f.name)}
                    className="text-[9px] font-mono text-green-900 hover:text-red-400 shrink-0 ml-1 transition-colors"
                    title="친구 삭제"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DM 대화창 ── */}
      {tab === "friends" && selectedFriend && (
        <>
          {/* DM 헤더 */}
          <div className="shrink-0 flex items-center gap-2 px-2 py-1 border-b border-green-900">
            <button
              onClick={() => setSelectedFriend(null)}
              className="text-green-700 hover:text-green-400 text-[10px] font-mono transition-colors"
            >
              ←
            </button>
            <span className="text-green-400 text-[10px] font-mono font-bold">
              {selectedFriend.name}
            </span>
          </div>

          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 min-h-0">
            {dmLoading && (
              <div className="text-green-900 text-[10px] font-mono text-center py-4">로딩 중...</div>
            )}
            {!dmLoading && dmMessages.length === 0 && (
              <div className="text-green-900 text-[10px] font-mono text-center py-4">
                대화 없음
              </div>
            )}
            {dmMessages.map((msg) => {
              const time = msg.created_at.split("T")[1]?.slice(0, 5) ?? "";
              return (
                <div
                  key={msg.id}
                  className={`font-mono text-[10px] leading-relaxed ${msg.is_mine ? "text-right" : ""}`}
                >
                  {!msg.is_mine && (
                    <span className="text-green-900 select-none mr-1">{time}</span>
                  )}
                  {!msg.is_mine && (
                    <span className="text-green-600">{msg.sender_name}: </span>
                  )}
                  <span className={msg.is_mine ? "text-green-300" : "text-green-400"}>
                    {msg.message}
                  </span>
                  {msg.is_mine && (
                    <span className="text-green-900 select-none ml-1">{time}</span>
                  )}
                </div>
              );
            })}
            <div ref={dmBottomRef} />
          </div>

          {/* DM 입력 */}
          <form
            onSubmit={handleDmSend}
            className="shrink-0 border-t border-green-900 flex items-center gap-1 px-2 py-1"
          >
            <span className="text-green-700 text-[10px] font-mono shrink-0 select-none">›</span>
            <input
              type="text"
              value={dmDraft}
              onChange={(e) => setDmDraft(e.target.value)}
              placeholder={`${selectedFriend.name}에게...`}
              disabled={dmSending}
              maxLength={200}
              autoFocus
              className="flex-1 bg-transparent text-green-300 text-[10px] font-mono outline-none placeholder-green-900 min-w-0"
            />
          </form>
        </>
      )}
    </div>
  );
}
