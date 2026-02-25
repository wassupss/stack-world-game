"use client";

// ============================================================
// STACKWORLD - 커뮤니티 Realtime 훅
// community_messages / direct_messages / friendships 구독
// ============================================================
import { useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export interface CommunityMessage {
  id: string;
  character_id: string;
  character_name: string;
  message: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export interface FriendRequestEvent {
  requester_id:   string;
  requester_name: string; // friendships 테이블에 이름 없으므로 별도 조회 후 전달
}

interface Options {
  myCharacterId?: string;
  onDirectMessage?:  (msg: DirectMessage) => void;
  onFriendRequest?:  (req: { character_id: string }) => void;
}

export function useCommunityRealtime(
  onMessage: (msg: CommunityMessage) => void,
  options: Options = {},
) {
  const { myCharacterId, onDirectMessage, onFriendRequest } = options;
  const supabase = createBrowserClient();

  const handleCommunityInsert = useCallback(
    (row: Record<string, unknown>) => {
      onMessage({
        id:             String(row.id ?? ""),
        character_id:   String(row.character_id ?? ""),
        character_name: String(row.character_name ?? "???"),
        message:        String(row.message ?? ""),
        created_at:     String(row.created_at ?? new Date().toISOString()),
      });
    },
    [onMessage],
  );

  const handleDmInsert = useCallback(
    (row: Record<string, unknown>) => {
      onDirectMessage?.({
        id:          String(row.id ?? ""),
        sender_id:   String(row.sender_id ?? ""),
        sender_name: String(row.sender_name ?? "???"),
        message:     String(row.message ?? ""),
        created_at:  String(row.created_at ?? new Date().toISOString()),
      });
    },
    [onDirectMessage],
  );

  const handleFriendshipInsert = useCallback(
    (row: Record<string, unknown>) => {
      // 내가 addressee인 경우에만 (친구 요청 수신)
      if (String(row.addressee_id ?? "") === myCharacterId) {
        onFriendRequest?.({ character_id: String(row.requester_id ?? "") });
      }
    },
    [myCharacterId, onFriendRequest],
  );

  useEffect(() => {
    const channel = supabase
      .channel("community-realtime")
      // 전역 채팅
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_messages" },
        (payload) => handleCommunityInsert(payload.new as Record<string, unknown>),
      );

    // DM: 내가 수신자인 메시지만
    if (myCharacterId && onDirectMessage) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `receiver_id=eq.${myCharacterId}`,
        },
        (payload) => handleDmInsert(payload.new as Record<string, unknown>),
      );
    }

    // 친구 요청: 내가 addressee인 새 row
    if (myCharacterId && onFriendRequest) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendships",
          filter: `addressee_id=eq.${myCharacterId}`,
        },
        (payload) => handleFriendshipInsert(payload.new as Record<string, unknown>),
      );
    }

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, myCharacterId]);
}
