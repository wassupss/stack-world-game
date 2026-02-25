-- ============================================================
-- STACKWORLD Migration 009
-- 친구 DM + 친구 요청 실시간 알림
-- ============================================================

-- ──────────── direct_messages 테이블 ────────────
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id     UUID        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  sender_name   TEXT        NOT NULL,  -- realtime payload에 JOIN 불필요
  receiver_id   UUID        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  message       TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 200),
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_dm_receiver ON public.direct_messages (receiver_id, created_at DESC);
CREATE INDEX idx_dm_conversation ON public.direct_messages (
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 본인이 보낸 or 받은 메시지만 조회
CREATE POLICY "dm_select" ON public.direct_messages
  FOR SELECT USING (
    sender_id   = public.my_character_id() OR
    receiver_id = public.my_character_id()
  );

-- 본인이 sender인 경우에만 삽입
CREATE POLICY "dm_insert" ON public.direct_messages
  FOR INSERT WITH CHECK (sender_id = public.my_character_id());

-- ──────────── Realtime 구독 대상 추가 ────────────
-- direct_messages: 수신자 필터로 실시간 DM 알림
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- friendships: 친구 요청/수락 실시간 알림
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
