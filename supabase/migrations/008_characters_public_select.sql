-- ============================================================
-- STACKWORLD Migration 008
-- characters 테이블: 인증된 유저는 모든 캐릭터 조회 가능
-- (친구 추가, 파티 표시 등 소셜 기능에 필요)
-- ============================================================

-- 기존 본인 전용 SELECT 정책 제거
DROP POLICY IF EXISTS "characters_select_own" ON public.characters;

-- 인증된 유저라면 모든 캐릭터의 기본 정보 조회 가능
CREATE POLICY "characters_select_authenticated" ON public.characters
  FOR SELECT USING (auth.role() = 'authenticated');
