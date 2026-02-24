-- ============================================================
-- STACKWORLD - 004: RPC 함수 (Edge Functions에서 사용)
-- ============================================================

-- ──────────── XP 지급 ────────────
CREATE OR REPLACE FUNCTION public.grant_position_xp(
  p_character_id UUID,
  p_position TEXT,
  p_xp BIGINT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_xp BIGINT;
  v_new_xp BIGINT;
  v_new_level INTEGER;
BEGIN
  SELECT xp INTO v_current_xp
  FROM public.position_mastery
  WHERE character_id = p_character_id AND position = p_position::public.position_type;

  v_new_xp := COALESCE(v_current_xp, 0) + p_xp;
  v_new_level := public.xp_to_level(v_new_xp);

  UPDATE public.position_mastery
  SET xp = v_new_xp, level = v_new_level, updated_at = NOW()
  WHERE character_id = p_character_id AND position = p_position::public.position_type;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_core_xp(
  p_character_id UUID,
  p_core TEXT,
  p_xp BIGINT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_current_xp BIGINT;
  v_new_xp BIGINT;
  v_new_level INTEGER;
BEGIN
  SELECT xp INTO v_current_xp
  FROM public.core_mastery
  WHERE character_id = p_character_id AND core = p_core::public.core_skill_type;

  v_new_xp := COALESCE(v_current_xp, 0) + p_xp;
  v_new_level := public.xp_to_level(v_new_xp);

  UPDATE public.core_mastery
  SET xp = v_new_xp, level = v_new_level, updated_at = NOW()
  WHERE character_id = p_character_id AND core = p_core::public.core_skill_type;
END;
$$;

-- ──────────── 크레딧 지급/차감 ────────────
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_character_id UUID,
  p_amount INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.characters
  SET credits = GREATEST(0, credits + p_amount)
  WHERE id = p_character_id;
END;
$$;

-- ──────────── 인벤토리 조작 ────────────
CREATE OR REPLACE FUNCTION public.add_inventory(
  p_character_id UUID,
  p_artifact_key TEXT,
  p_qty INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.inventory (character_id, artifact_key, qty)
  VALUES (p_character_id, p_artifact_key, p_qty)
  ON CONFLICT (character_id, artifact_key)
  DO UPDATE SET qty = public.inventory.qty + EXCLUDED.qty;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_inventory(
  p_character_id UUID,
  p_artifact_key TEXT,
  p_qty INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.inventory
  SET qty = qty - p_qty
  WHERE character_id = p_character_id AND artifact_key = p_artifact_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION '인벤토리 항목을 찾을 수 없습니다: %', p_artifact_key;
  END IF;
END;
$$;

-- ──────────── 런 커맨드 카운터 ────────────
CREATE OR REPLACE FUNCTION public.increment_run_cmd_count(p_run_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.runs SET cmd_count = cmd_count + 1 WHERE id = p_run_id;
END;
$$;

-- ──────────── Daily Stats 업데이트 ────────────
CREATE OR REPLACE FUNCTION public.upsert_daily_stats(
  p_day DATE,
  p_character_id UUID,
  p_score INTEGER,
  p_quality INTEGER,
  p_debt_delta INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.daily_character_stats (day, character_id, runs_count, avg_score, avg_quality, avg_debt_delta)
  VALUES (p_day, p_character_id, 1, p_score, p_quality, p_debt_delta)
  ON CONFLICT (day, character_id) DO UPDATE SET
    runs_count    = daily_character_stats.runs_count + 1,
    avg_score     = (daily_character_stats.avg_score * daily_character_stats.runs_count + p_score) / (daily_character_stats.runs_count + 1),
    avg_quality   = (daily_character_stats.avg_quality * daily_character_stats.runs_count + p_quality) / (daily_character_stats.runs_count + 1),
    avg_debt_delta = (daily_character_stats.avg_debt_delta * daily_character_stats.runs_count + p_debt_delta) / (daily_character_stats.runs_count + 1);
END;
$$;

-- ──────────── 리더보드 증가 (atomic) ────────────
CREATE OR REPLACE FUNCTION public.increment_leaderboard(
  p_season_id UUID,
  p_mode TEXT,
  p_character_id UUID,
  p_score INTEGER
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.leaderboards (season_id, mode, character_id, total_score, match_count, updated_at)
  VALUES (p_season_id, p_mode::public.pvp_mode_type, p_character_id, p_score, 1, NOW())
  ON CONFLICT (season_id, mode, character_id) DO UPDATE SET
    total_score = leaderboards.total_score + p_score,
    match_count = leaderboards.match_count + 1,
    updated_at = NOW();
END;
$$;

-- ──────────── 관리자 RPC (사내 운영) ────────────
-- 캐릭터 리셋 (관리자 전용)
CREATE OR REPLACE FUNCTION public.admin_reset_character(p_character_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 포지션 숙련 리셋
  UPDATE public.position_mastery SET xp = 0, level = 1 WHERE character_id = p_character_id;
  -- 코어 숙련 리셋
  UPDATE public.core_mastery SET xp = 0, level = 1 WHERE character_id = p_character_id;
  -- 크레딧 리셋
  UPDATE public.characters SET credits = 0 WHERE id = p_character_id;
  -- 런 전체 abandon
  UPDATE public.runs SET status = 'abandoned', ended_at = NOW()
  WHERE character_id = p_character_id AND status = 'active';
  -- 인벤토리 삭제
  DELETE FROM public.inventory WHERE character_id = p_character_id;
  -- 타이틀 삭제
  DELETE FROM public.character_titles WHERE character_id = p_character_id;
END;
$$;

-- 시즌 강제 종료 (관리자 전용)
CREATE OR REPLACE FUNCTION public.admin_end_season(p_season_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.seasons SET is_active = FALSE WHERE id = p_season_id;
END;
$$;
