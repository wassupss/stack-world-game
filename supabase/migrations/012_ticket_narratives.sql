-- ============================================================
-- Migration 012: tickets 테이블에 narratives JSONB 컬럼 추가
-- 각 티켓의 결과(critical/success/fail/fumble)별 내러티브 문구
-- ============================================================

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS narratives JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.tickets.narratives IS
  '결과별 내러티브 문구. 키: critical | success | fail | fumble';
