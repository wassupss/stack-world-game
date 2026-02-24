-- ============================================================
-- STACKWORLD - 003: 인덱스 + 트리거 + 초기 데이터
-- ============================================================

-- ──────────── 인덱스 ────────────

-- characters
CREATE INDEX idx_characters_user_id ON public.characters(user_id);

-- mastery
CREATE INDEX idx_position_mastery_character ON public.position_mastery(character_id);
CREATE INDEX idx_core_mastery_character ON public.core_mastery(character_id);

-- runs (로그 정리 시 created_at 기반 삭제 최적화)
CREATE INDEX idx_runs_character_id ON public.runs(character_id);
CREATE INDEX idx_runs_status ON public.runs(status);
CREATE INDEX idx_runs_season_id ON public.runs(season_id);
CREATE INDEX idx_run_commands_run_id ON public.run_commands(run_id);
CREATE INDEX idx_run_commands_created_at ON public.run_commands(created_at);
CREATE INDEX idx_run_events_run_id ON public.run_events(run_id);
CREATE INDEX idx_run_events_created_at ON public.run_events(created_at);

-- raids
CREATE INDEX idx_raids_party_id ON public.raids(party_id);
CREATE INDEX idx_raids_status ON public.raids(status);
CREATE INDEX idx_raid_events_raid_id ON public.raid_events(raid_id);
CREATE INDEX idx_raid_events_created_at ON public.raid_events(created_at);
CREATE INDEX idx_raid_commands_raid_id ON public.raid_commands(raid_id);

-- pvp
CREATE INDEX idx_pvp_entries_match_id ON public.pvp_entries(match_id);
CREATE INDEX idx_pvp_entries_character_id ON public.pvp_entries(character_id);
CREATE INDEX idx_leaderboards_season_mode ON public.leaderboards(season_id, mode);

-- market
CREATE INDEX idx_market_listings_artifact ON public.market_listings(artifact_key) WHERE is_active = TRUE;
CREATE INDEX idx_contracts_expires ON public.contracts(expires_at) WHERE filled_by IS NULL;

-- daily stats
CREATE INDEX idx_daily_stats_character_day ON public.daily_character_stats(character_id, day);

-- ──────────── 트리거: position_mastery 자동 초기화 ────────────
-- 캐릭터 생성 시 모든 포지션/코어 숙련 레코드 자동 생성
CREATE OR REPLACE FUNCTION public.init_character_mastery()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.position_mastery (character_id, position)
  SELECT NEW.id, unnest(ARRAY['FE', 'BE', 'INFRA', 'QA']::public.position_type[]);

  INSERT INTO public.core_mastery (character_id, core)
  SELECT NEW.id, unnest(ARRAY[
    'problem_solving', 'debugging', 'design', 'delivery', 'collaboration'
  ]::public.core_skill_type[]);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_init_character_mastery
AFTER INSERT ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.init_character_mastery();

-- ──────────── 트리거: updated_at 자동 갱신 ────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_position_mastery_updated_at
BEFORE UPDATE ON public.position_mastery
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_core_mastery_updated_at
BEFORE UPDATE ON public.core_mastery
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ──────────── 초기 운영 데이터 ────────────

-- cleanup_jobs 초기값
INSERT INTO public.cleanup_jobs (job_key, last_run_at) VALUES
  ('daily_log_cleanup', NOW() - INTERVAL '1 day'),
  ('contract_refresh',  NOW() - INTERVAL '1 day'),
  ('season_check',      NOW() - INTERVAL '1 day');

-- 시즌 1 (초기 시즌)
INSERT INTO public.seasons (name, starts_at, ends_at, is_active) VALUES
  ('Season 1: Alpha Launch',
   NOW(),
   NOW() + INTERVAL '28 days',
   TRUE);

-- ──────────── XP 레벨 계산 함수 ────────────
-- xp_to_level(xp) → level (소프트캡 포함)
CREATE OR REPLACE FUNCTION public.xp_to_level(p_xp BIGINT)
RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_level INTEGER := 1;
  v_required BIGINT := 100;
  v_remaining BIGINT := p_xp;
  v_soft_cap INTEGER := 30;
  v_soft_factor NUMERIC := 0.7;
BEGIN
  LOOP
    IF v_level >= v_soft_cap THEN
      v_required := (100 * POWER(1.5, v_soft_cap - 1) / v_soft_factor)::BIGINT;
    ELSE
      v_required := (100 * POWER(1.5, v_level - 1))::BIGINT;
    END IF;

    EXIT WHEN v_remaining < v_required;
    v_remaining := v_remaining - v_required;
    v_level := v_level + 1;
  END LOOP;

  RETURN v_level;
END;
$$;

-- devpower 계산 함수
CREATE OR REPLACE FUNCTION public.calc_devpower(p_character_id UUID)
RETURNS INTEGER LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_position_sum INTEGER;
  v_core_sum INTEGER;
  v_min_position INTEGER;
BEGIN
  SELECT
    COALESCE(SUM(level), 0),
    COALESCE(MIN(level), 1)
  INTO v_position_sum, v_min_position
  FROM public.position_mastery
  WHERE character_id = p_character_id;

  SELECT COALESCE(SUM(level), 0)
  INTO v_core_sum
  FROM public.core_mastery
  WHERE character_id = p_character_id;

  RETURN (v_position_sum * 1.0 + v_core_sum * 1.5 + v_min_position * 5)::INTEGER;
END;
$$;

-- ──────────── Realtime 설정 확인용 뷰 ────────────
CREATE OR REPLACE VIEW public.active_raids AS
SELECT r.*, p.code AS party_code
FROM public.raids r
JOIN public.parties p ON r.party_id = p.id
WHERE r.status IN ('waiting', 'active');

COMMENT ON TABLE public.raid_events IS
  'Realtime 구독 대상. raid_events만 Realtime 사용 (Free tier 절약).';
