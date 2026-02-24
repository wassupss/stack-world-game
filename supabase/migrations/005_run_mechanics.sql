-- ============================================================
-- STACKWORLD - 005: Run Mechanics (Streak / Effects / Position Synergy)
-- 4대 게임 메카닉을 위한 runs 테이블 컬럼 추가
-- ============================================================

ALTER TABLE public.runs
  ADD COLUMN IF NOT EXISTS current_streak     INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_effects     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS position_streak    INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_streak_tag TEXT;

-- active_effects JSONB 검색용 GIN 인덱스
CREATE INDEX IF NOT EXISTS idx_runs_active_effects
  ON public.runs USING GIN (active_effects);

COMMENT ON COLUMN public.runs.current_streak IS
  '연속 work 성공 카운터. 실패/FUMBLE 시 0으로 리셋.';
COMMENT ON COLUMN public.runs.active_effects IS
  '활성 상태 효과 배열. [{type, magnitude, turns_left}] — run_command Edge Function 전용 기록.';
COMMENT ON COLUMN public.runs.position_streak IS
  '동일 position_tag 연속 성공 카운터.';
COMMENT ON COLUMN public.runs.position_streak_tag IS
  '현재 포지션 스트릭 추적 중인 position_tag.';
