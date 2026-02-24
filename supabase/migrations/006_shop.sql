-- ============================================================
-- STACKWORLD - 006: 상점 시스템
-- ============================================================

-- ──────────── 상점 아이템 카탈로그 ────────────
CREATE TABLE public.shop_items (
  item_key    TEXT PRIMARY KEY,
  item_type   TEXT NOT NULL CHECK (item_type IN ('upgrade', 'consumable', 'skill', 'modifier')),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price       INTEGER NOT NULL CHECK (price > 0),
  effect_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  max_level   INTEGER NOT NULL DEFAULT 1,
  rarity      TEXT NOT NULL DEFAULT 'common'
);

-- ──────────── 캐릭터 업그레이드/스킬 (영구) ────────────
CREATE TABLE public.character_upgrades (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_key     TEXT NOT NULL REFERENCES public.shop_items(item_key),
  level        INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, item_key)
);

-- ──────────── 캐릭터 소모품/수식어 (수량 관리) ────────────
CREATE TABLE public.character_items (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_key     TEXT NOT NULL REFERENCES public.shop_items(item_key),
  qty          INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (character_id, item_key)
);

-- ──────────── runs 에 활성 수식어 + 스킬 쿨다운 추가 ────────────
ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS active_modifier  TEXT,
  ADD COLUMN IF NOT EXISTS skill_cooldowns  JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ──────────── characters 에 대기 수식어 추가 ────────────
-- run start 시 자동 적용 후 null로 초기화
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS queued_modifier TEXT;

-- ──────────── RLS ────────────
ALTER TABLE public.shop_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_items    ENABLE ROW LEVEL SECURITY;

-- shop_items: 누구나 읽기
CREATE POLICY "shop_items_read" ON public.shop_items
  FOR SELECT USING (true);

-- character_upgrades: 본인만
CREATE POLICY "char_upgrades_own" ON public.character_upgrades
  FOR ALL USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- character_items: 본인만
CREATE POLICY "char_items_own" ON public.character_items
  FOR ALL USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- ──────────── 인덱스 ────────────
CREATE INDEX IF NOT EXISTS idx_char_upgrades_char ON public.character_upgrades (character_id);
CREATE INDEX IF NOT EXISTS idx_char_items_char    ON public.character_items (character_id);
