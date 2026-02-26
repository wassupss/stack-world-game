-- ============================================================
-- Migration 011: 페이즈별 도박 선택지 레이블 개선
-- 모든 이벤트의 gamble 선택지(index 3)를 각 페이즈 문맥에 맞게 교체
-- ============================================================

DO $$
DECLARE
  ev          RECORD;
  gamble_obj  JSONB;
  phase_label TEXT;
  phase_desc  TEXT;
  fail_label  TEXT;
BEGIN
  FOR ev IN
    SELECT event_key, phase, choices
    FROM events
    WHERE jsonb_array_length(choices) = 4
      AND (choices -> 3 ->> 'risk_level') = 'gamble'
  LOOP
    phase_label := CASE ev.phase
      WHEN 'plan'      THEN '전면 재설계 강행'
      WHEN 'implement' THEN '야간 코딩 마라톤'
      WHEN 'test'      THEN '올인 버그 헌팅'
      WHEN 'deploy'    THEN '블루-그린 즉시 전환'
      WHEN 'operate'   THEN '전체 시스템 재시작'
      ELSE                  '도박적 선택'
    END;

    phase_desc := CASE ev.phase
      WHEN 'plan'      THEN '기존 설계를 버리고 처음부터 완전히 다시 설계한다. 대성공이면 최적 설계, 실패면 일정 붕괴.'
      WHEN 'implement' THEN '팀 전원이 밤새 코딩에 집중한다. 대성공이면 일정 단축, 실패면 번아웃과 품질 저하.'
      WHEN 'test'      THEN '모든 QA 리소스를 한 곳에 집중 투입한다. 대성공이면 완벽한 품질, 실패면 놓친 버그 폭탄.'
      WHEN 'deploy'    THEN '검증 없이 새 버전으로 즉시 전환한다. 대성공이면 신속 배포, 실패면 장애 발생.'
      WHEN 'operate'   THEN '운영 중인 시스템 전체를 재시작한다. 대성공이면 성능 복구, 실패면 데이터 손실 위험.'
      ELSE                  '극단적인 선택 — 대성공 또는 대실패.'
    END;

    fail_label := CASE ev.phase
      WHEN 'plan'      THEN '설계 붕괴'
      WHEN 'implement' THEN '번아웃 붕괴'
      WHEN 'test'      THEN '버그 폭탄'
      WHEN 'deploy'    THEN '장애 발생'
      WHEN 'operate'   THEN '시스템 다운'
      ELSE                  '대실패'
    END;

    -- gamble 선택지의 label/description/outcomes.fail.label 업데이트
    gamble_obj := ev.choices -> 3;

    -- label, description 교체
    gamble_obj := gamble_obj
      || jsonb_build_object('label', phase_label)
      || jsonb_build_object('description', phase_desc);

    -- outcomes 배열의 fail outcome label 교체
    IF gamble_obj ? 'outcomes' AND jsonb_array_length(gamble_obj->'outcomes') = 3 THEN
      gamble_obj := jsonb_set(
        gamble_obj,
        '{outcomes, 2, label}',
        to_jsonb(fail_label)
      );
    END IF;

    UPDATE events
    SET choices = jsonb_set(choices, '{3}', gamble_obj)
    WHERE event_key = ev.event_key;

  END LOOP;
END;
$$;
