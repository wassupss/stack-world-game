-- ============================================================
-- Migration 010: 이벤트 선택지 확률 기반 구조 변환
-- 기존 3개 고정값 선택지 → 4개 risk_level + outcomes(prob) 구조
-- ============================================================

DO $$
DECLARE
  ev   RECORD;
  c0   JSONB;
  c1   JSONB;
  c2   JSONB;
  new_choices JSONB;
BEGIN
  FOR ev IN SELECT event_key, choices FROM events LOOP

    -- 이미 마이그레이션된 경우 스킵 (risk_level 필드 존재 여부로 판단)
    IF jsonb_typeof(ev.choices) = 'array'
       AND jsonb_array_length(ev.choices) > 0
       AND (ev.choices->0) ? 'risk_level' THEN
      CONTINUE;
    END IF;

    -- 선택지가 배열이 아니거나 3개 미만이면 스킵
    IF jsonb_typeof(ev.choices) != 'array' OR jsonb_array_length(ev.choices) < 3 THEN
      CONTINUE;
    END IF;

    c0 := ev.choices->0;
    c1 := ev.choices->1;
    c2 := ev.choices->2;

    new_choices := jsonb_build_array(

      -- ── Choice 0: safe (성공 75% / 부분 15% / 실패 10%) ──
      jsonb_build_object(
        'label',       c0->>'label',
        'description', COALESCE(c0->>'description', ''),
        'risk_level',  'safe',
        'outcomes', jsonb_build_array(
          jsonb_build_object(
            'type', 'success', 'label', '성공',
            'time_delta',    (c0->>'time_delta')::numeric,
            'risk_delta',    (c0->>'risk_delta')::numeric,
            'debt_delta',    (c0->>'debt_delta')::numeric,
            'quality_delta', (c0->>'quality_delta')::numeric,
            'prob', 0.75
          ),
          jsonb_build_object(
            'type', 'partial', 'label', '부분 성공',
            'time_delta',    round((c0->>'time_delta')::numeric    * 0.5),
            'risk_delta',    round((c0->>'risk_delta')::numeric    * 0.5),
            'debt_delta',    round((c0->>'debt_delta')::numeric    * 0.5),
            'quality_delta', round((c0->>'quality_delta')::numeric * 0.5),
            'prob', 0.15
          ),
          jsonb_build_object(
            'type', 'fail', 'label', '실패',
            'time_delta',    round((c0->>'time_delta')::numeric    * -0.5),
            'risk_delta',    round((c0->>'risk_delta')::numeric    * -0.5),
            'debt_delta',    round((c0->>'debt_delta')::numeric    * -0.5),
            'quality_delta', round((c0->>'quality_delta')::numeric * -0.5),
            'prob', 0.10
          )
        )
      ),

      -- ── Choice 1: balanced (성공 60% / 부분 25% / 실패 15%) ──
      jsonb_build_object(
        'label',       c1->>'label',
        'description', COALESCE(c1->>'description', ''),
        'risk_level',  'balanced',
        'outcomes', jsonb_build_array(
          jsonb_build_object(
            'type', 'success', 'label', '성공',
            'time_delta',    (c1->>'time_delta')::numeric,
            'risk_delta',    (c1->>'risk_delta')::numeric,
            'debt_delta',    (c1->>'debt_delta')::numeric,
            'quality_delta', (c1->>'quality_delta')::numeric,
            'prob', 0.60
          ),
          jsonb_build_object(
            'type', 'partial', 'label', '부분 성공',
            'time_delta',    round((c1->>'time_delta')::numeric    * 0.5),
            'risk_delta',    round((c1->>'risk_delta')::numeric    * 0.5),
            'debt_delta',    round((c1->>'debt_delta')::numeric    * 0.5),
            'quality_delta', round((c1->>'quality_delta')::numeric * 0.5),
            'prob', 0.25
          ),
          jsonb_build_object(
            'type', 'fail', 'label', '실패',
            'time_delta',    round((c1->>'time_delta')::numeric    * -0.5),
            'risk_delta',    round((c1->>'risk_delta')::numeric    * -0.5),
            'debt_delta',    round((c1->>'debt_delta')::numeric    * -0.5),
            'quality_delta', round((c1->>'quality_delta')::numeric * -0.5),
            'prob', 0.15
          )
        )
      ),

      -- ── Choice 2: risky (성공 40% / 부분 25% / 실패 35%) ──
      jsonb_build_object(
        'label',       c2->>'label',
        'description', COALESCE(c2->>'description', ''),
        'risk_level',  'risky',
        'outcomes', jsonb_build_array(
          jsonb_build_object(
            'type', 'success', 'label', '성공',
            'time_delta',    (c2->>'time_delta')::numeric,
            'risk_delta',    (c2->>'risk_delta')::numeric,
            'debt_delta',    (c2->>'debt_delta')::numeric,
            'quality_delta', (c2->>'quality_delta')::numeric,
            'prob', 0.40
          ),
          jsonb_build_object(
            'type', 'partial', 'label', '부분 성공',
            'time_delta',    round((c2->>'time_delta')::numeric    * 0.5),
            'risk_delta',    round((c2->>'risk_delta')::numeric    * 0.5),
            'debt_delta',    round((c2->>'debt_delta')::numeric    * 0.5),
            'quality_delta', round((c2->>'quality_delta')::numeric * 0.5),
            'prob', 0.25
          ),
          jsonb_build_object(
            'type', 'fail', 'label', '실패',
            'time_delta',    round((c2->>'time_delta')::numeric    * -0.5),
            'risk_delta',    round((c2->>'risk_delta')::numeric    * -0.5),
            'debt_delta',    round((c2->>'debt_delta')::numeric    * -0.5),
            'quality_delta', round((c2->>'quality_delta')::numeric * -0.5),
            'prob', 0.35
          )
        )
      ),

      -- ── Choice 3: gamble (성공 25% / 부분 15% / 실패 60%) — choice[2] 기반 스케일 ──
      jsonb_build_object(
        'label',       '도박적 선택',
        'description', '극단적인 선택 — 대성공 또는 대실패',
        'risk_level',  'gamble',
        'outcomes', jsonb_build_array(
          jsonb_build_object(
            'type', 'success', 'label', '대성공',
            'time_delta',    round((c2->>'time_delta')::numeric    * 1.5),
            'risk_delta',    round((c2->>'risk_delta')::numeric    * 1.5),
            'debt_delta',    round((c2->>'debt_delta')::numeric    * 1.5),
            'quality_delta', round((c2->>'quality_delta')::numeric * 1.5),
            'prob', 0.25
          ),
          jsonb_build_object(
            'type', 'partial', 'label', '절반의 성공',
            'time_delta',    (c2->>'time_delta')::numeric,
            'risk_delta',    (c2->>'risk_delta')::numeric,
            'debt_delta',    (c2->>'debt_delta')::numeric,
            'quality_delta', (c2->>'quality_delta')::numeric,
            'prob', 0.15
          ),
          jsonb_build_object(
            'type', 'fail', 'label', '대실패',
            'time_delta',    round((c2->>'time_delta')::numeric    * -0.8),
            'risk_delta',    round((c2->>'risk_delta')::numeric    * -0.8),
            'debt_delta',    round((c2->>'debt_delta')::numeric    * -0.8),
            'quality_delta', round((c2->>'quality_delta')::numeric * -0.8),
            'prob', 0.60
          )
        )
      )

    ); -- end jsonb_build_array

    UPDATE events SET choices = new_choices WHERE event_key = ev.event_key;

  END LOOP;
END;
$$;
