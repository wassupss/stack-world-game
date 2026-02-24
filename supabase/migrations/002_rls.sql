-- ============================================================
-- STACKWORLD - 002: Row Level Security (RLS)
-- ============================================================

-- ──────────── RLS 활성화 ────────────
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.position_mastery  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_mastery      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_titles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_commands      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parties           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raids             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raid_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raid_commands     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pvp_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_listings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_character_stats ENABLE ROW LEVEL SECURITY;

-- 카탈로그 테이블은 RLS 없음 (전체 공개 읽기)
-- tickets, events, artifacts, raid_scenarios, seasons

-- ──────────── 헬퍼 함수 ────────────

-- 현재 유저의 character_id 조회
CREATE OR REPLACE FUNCTION public.my_character_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.characters WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 현재 유저가 해당 파티 멤버인지 확인
CREATE OR REPLACE FUNCTION public.is_party_member(p_party_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.party_members pm
    WHERE pm.party_id = p_party_id
      AND pm.character_id = public.my_character_id()
  );
$$;

-- 현재 유저가 해당 레이드 파티 멤버인지 확인
CREATE OR REPLACE FUNCTION public.is_raid_member(p_raid_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.raids r
    WHERE r.id = p_raid_id
      AND public.is_party_member(r.party_id)
  );
$$;

-- ──────────── profiles ────────────
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- ──────────── characters ────────────
CREATE POLICY "characters_select_own" ON public.characters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "characters_insert_own" ON public.characters
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 업데이트는 Edge Function (service role)이 수행
CREATE POLICY "characters_update_own" ON public.characters
  FOR UPDATE USING (user_id = auth.uid());

-- ──────────── position_mastery / core_mastery ────────────
CREATE POLICY "position_mastery_select_own" ON public.position_mastery
  FOR SELECT USING (character_id = public.my_character_id());

CREATE POLICY "core_mastery_select_own" ON public.core_mastery
  FOR SELECT USING (character_id = public.my_character_id());

-- ──────────── character_titles ────────────
CREATE POLICY "titles_select_own" ON public.character_titles
  FOR SELECT USING (character_id = public.my_character_id());

-- ──────────── blueprints / inventory ────────────
CREATE POLICY "blueprints_select_own" ON public.blueprints
  FOR SELECT USING (character_id = public.my_character_id());

CREATE POLICY "inventory_select_own" ON public.inventory
  FOR SELECT USING (character_id = public.my_character_id());

-- ──────────── runs / run_commands / run_events ────────────
CREATE POLICY "runs_select_own" ON public.runs
  FOR SELECT USING (character_id = public.my_character_id());

CREATE POLICY "runs_insert_own" ON public.runs
  FOR INSERT WITH CHECK (character_id = public.my_character_id());

CREATE POLICY "run_commands_select_own" ON public.run_commands
  FOR SELECT USING (character_id = public.my_character_id());

CREATE POLICY "run_commands_insert_own" ON public.run_commands
  FOR INSERT WITH CHECK (character_id = public.my_character_id());

CREATE POLICY "run_events_select_own" ON public.run_events
  FOR SELECT USING (
    run_id IN (
      SELECT id FROM public.runs WHERE character_id = public.my_character_id()
    )
  );

-- ──────────── parties / party_members ────────────
-- 파티 코드로 JOIN하려면 비멤버도 조회 가능해야 함
CREATE POLICY "parties_select_member" ON public.parties
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "parties_insert_own" ON public.parties
  FOR INSERT WITH CHECK (leader_id = public.my_character_id());

CREATE POLICY "party_members_select_member" ON public.party_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "party_members_insert_own" ON public.party_members
  FOR INSERT WITH CHECK (character_id = public.my_character_id());

CREATE POLICY "party_members_delete_own" ON public.party_members
  FOR DELETE USING (character_id = public.my_character_id());

-- ──────────── raids / raid_events / raid_commands ────────────
CREATE POLICY "raids_select_member" ON public.raids
  FOR SELECT USING (public.is_party_member(party_id));

CREATE POLICY "raid_events_select_member" ON public.raid_events
  FOR SELECT USING (public.is_raid_member(raid_id));

CREATE POLICY "raid_commands_select_member" ON public.raid_commands
  FOR SELECT USING (character_id = public.my_character_id());

CREATE POLICY "raid_commands_insert_own" ON public.raid_commands
  FOR INSERT WITH CHECK (character_id = public.my_character_id());

-- ──────────── pvp ────────────
-- 매치는 전체 공개 (queuing 상태 탐색)
CREATE POLICY "pvp_matches_select_all" ON public.pvp_matches
  FOR SELECT USING (TRUE);

CREATE POLICY "pvp_entries_select_own" ON public.pvp_entries
  FOR SELECT USING (character_id = public.my_character_id());

CREATE POLICY "pvp_entries_insert_own" ON public.pvp_entries
  FOR INSERT WITH CHECK (character_id = public.my_character_id());

-- 리더보드는 전체 공개
CREATE POLICY "leaderboards_select_all" ON public.leaderboards
  FOR SELECT USING (TRUE);

-- ──────────── market ────────────
CREATE POLICY "market_listings_select_all" ON public.market_listings
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "market_listings_insert_own" ON public.market_listings
  FOR INSERT WITH CHECK (seller_id = public.my_character_id());

CREATE POLICY "contracts_select_all" ON public.contracts
  FOR SELECT USING (filled_by IS NULL OR filled_by = public.my_character_id());

-- ──────────── daily_character_stats ────────────
-- 내 통계는 본인만, 시즌 리더보드는 leaderboards 테이블에서
CREATE POLICY "daily_stats_select_own" ON public.daily_character_stats
  FOR SELECT USING (character_id = public.my_character_id());
