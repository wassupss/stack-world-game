-- ============================================================
-- STACKWORLD - 007: 커뮤니티 (전역 채팅 + 친구 관계)
-- ============================================================

-- ──────────── 전역 커뮤니티 채팅 ────────────
CREATE TABLE public.community_messages (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id   UUID         NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  character_name TEXT         NOT NULL,   -- 비정규화: Realtime payload에 이름 포함용
  message        TEXT         NOT NULL CHECK (char_length(message) BETWEEN 1 AND 200),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX community_messages_created_at_idx ON public.community_messages (created_at DESC);

-- Realtime 활성화 (INSERT 구독)
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_messages_select_all"
  ON public.community_messages FOR SELECT USING (true);

CREATE POLICY "community_messages_insert_own"
  ON public.community_messages FOR INSERT
  WITH CHECK (character_id = (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- ──────────── 친구 관계 ────────────
CREATE TABLE public.friendships (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  addressee_id UUID        NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_friend CHECK (requester_id != addressee_id),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX friendships_requester_idx ON public.friendships (requester_id);
CREATE INDEX friendships_addressee_idx ON public.friendships (addressee_id);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 관계자(요청자 또는 수신자)만 조회 가능
CREATE POLICY "friendships_select_parties"
  ON public.friendships FOR SELECT
  USING (
    requester_id = (SELECT id FROM public.characters WHERE user_id = auth.uid())
    OR addressee_id = (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- 본인이 요청자일 때만 삽입 가능
CREATE POLICY "friendships_insert_own"
  ON public.friendships FOR INSERT
  WITH CHECK (requester_id = (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- 수신자만 수락 처리 (status 변경)
CREATE POLICY "friendships_update_addressee"
  ON public.friendships FOR UPDATE
  USING (addressee_id = (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- 관계자 모두 삭제 가능 (친구 제거 / 요청 거절)
CREATE POLICY "friendships_delete_parties"
  ON public.friendships FOR DELETE
  USING (
    requester_id = (SELECT id FROM public.characters WHERE user_id = auth.uid())
    OR addressee_id = (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );
