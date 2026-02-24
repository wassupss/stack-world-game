-- ============================================================
-- STACKWORLD - 004: 레이드 시나리오 Seed 데이터
-- 실시간 인시던트 레이드 3개 + 비동기 런칭 레이드 1개
-- ============================================================

INSERT INTO public.raid_scenarios (
  scenario_key, name, mode, description,
  time_limit_sec, initial_kpi, target_kpi,
  events, actions
)
VALUES

-- ──────────────────────────────────────────────────────────────
-- [1] PAYMENT-OUTAGE: 결제 에러율 급증 + 중복처리 위험
-- ──────────────────────────────────────────────────────────────
(
  'PAYMENT_OUTAGE',
  '결제 시스템 아웃티지',
  'incident',
  '결제 API 에러율이 급증하고 있습니다. 중복 결제 처리 위험이 있으며, 재무팀에서 연락이 오고 있습니다. 10분 내 정상화가 목표입니다.',
  600,  -- 10분
  '{
    "error_rate": 45,
    "latency_p95": 3200,
    "success_rate": 55,
    "deploy_health": 70,
    "target_error_rate": 5,
    "target_success_rate": 95
  }'::jsonb,
  '{
    "error_rate": 5,
    "latency_p95": 800,
    "success_rate": 95,
    "target_error_rate": 5,
    "target_success_rate": 95
  }'::jsonb,
  '[
    {
      "at_sec": 0,
      "event_key": "RAID_PAY_001",
      "title": "결제 에러 알람 발생",
      "description": "결제 서비스 error_rate 45% 감지. 5분 전부터 급증 시작.",
      "severity": 4,
      "kpi_delta": {"error_rate": 0, "latency_p95": 0, "success_rate": 0}
    },
    {
      "at_sec": 60,
      "event_key": "RAID_PAY_002",
      "title": "중복 결제 로그 발견",
      "description": "동일 주문 ID로 2~3회 결제 시도 로그 확인. 아이템 팀에서 환불 요청 急증.",
      "severity": 5,
      "kpi_delta": {"error_rate": 5, "latency_p95": 200, "success_rate": -5}
    },
    {
      "at_sec": 120,
      "event_key": "RAID_PAY_003",
      "title": "DB 커넥션 풀 포화",
      "description": "결제 DB 커넥션 풀 98% 사용. 신규 요청 큐잉 시작.",
      "severity": 4,
      "kpi_delta": {"error_rate": 8, "latency_p95": 500, "success_rate": -8}
    },
    {
      "at_sec": 180,
      "event_key": "RAID_PAY_004",
      "title": "외부 PG사 타임아웃",
      "description": "3rd-party PG API p95 응답시간 4000ms 초과. 자체 타임아웃 설정 미비.",
      "severity": 3,
      "kpi_delta": {"error_rate": 3, "latency_p95": 800, "success_rate": -3}
    },
    {
      "at_sec": 240,
      "event_key": "RAID_PAY_005",
      "title": "서킷 브레이커 미작동",
      "description": "PG사 장애임에도 retry 폭풍 발생. 서킷 브레이커 설정 미비 확인.",
      "severity": 4,
      "kpi_delta": {"error_rate": 5, "latency_p95": 300, "success_rate": -5}
    },
    {
      "at_sec": 300,
      "event_key": "RAID_PAY_006",
      "title": "트래픽 급증 (미디어 노출)",
      "description": "마케팅 이슈로 SNS 노출. 결제 시도 2배 급증.",
      "severity": 3,
      "kpi_delta": {"error_rate": 10, "latency_p95": 400, "success_rate": -10}
    },
    {
      "at_sec": 360,
      "event_key": "RAID_PAY_007",
      "title": "임시 롤백 검토",
      "description": "최근 배포(2시간 전)와 에러율 상관관계 발견. 롤백 vs 핫픽스 결정 필요.",
      "severity": 3,
      "kpi_delta": {}
    },
    {
      "at_sec": 420,
      "event_key": "RAID_PAY_008",
      "title": "중복 결제 방지 로직 결함 발견",
      "description": "idempotency key 검사 로직에 race condition 발견. 동시 요청 시 미작동.",
      "severity": 5,
      "kpi_delta": {"error_rate": 3, "success_rate": -3}
    },
    {
      "at_sec": 480,
      "event_key": "RAID_PAY_009",
      "title": "CTO 에스컬레이션",
      "description": "CTO 직접 상황 파악 요청. 8분째 해결 안 됨. 압박 상승.",
      "severity": 2,
      "kpi_delta": {}
    },
    {
      "at_sec": 540,
      "event_key": "RAID_PAY_010",
      "title": "PG사 장애 일부 회복",
      "description": "PG사 측에서 일부 복구 완료. error_rate 자연 감소 시작.",
      "severity": 1,
      "kpi_delta": {"error_rate": -10, "latency_p95": -500, "success_rate": 10}
    }
  ]'::jsonb,
  '[
    {
      "action_key": "trace",
      "label": "분산 트레이싱",
      "description": "요청 경로 추적. BE 숙련 높을수록 빠른 원인 분석.",
      "kpi_effect": {"error_rate_reduce": 5, "latency_reduce": 200},
      "position_bonus": {"BE": 1.5, "INFRA": 1.2},
      "time_cost_sec": 30,
      "cooldown_sec": 60
    },
    {
      "action_key": "circuit_break",
      "label": "서킷 브레이커 적용",
      "description": "PG사 연동 서킷 브레이커 활성화. INFRA 숙련 필요.",
      "kpi_effect": {"error_rate_reduce": 15, "success_rate_add": 10},
      "position_bonus": {"BE": 1.3, "INFRA": 1.8},
      "time_cost_sec": 45,
      "cooldown_sec": 120,
      "required_position_level": {"INFRA": 5}
    },
    {
      "action_key": "rollback",
      "label": "배포 롤백",
      "description": "최근 배포 롤백. 근본 원인이 배포라면 효과적.",
      "kpi_effect": {"error_rate_reduce": 20, "success_rate_add": 15},
      "position_bonus": {"INFRA": 2.0, "BE": 1.2},
      "time_cost_sec": 60,
      "cooldown_sec": 180,
      "risk": "배포가 원인이 아닐 경우 효과 없음"
    },
    {
      "action_key": "scale",
      "label": "DB 커넥션 풀 확장",
      "description": "커넥션 풀 크기 증가. 임시 완화책.",
      "kpi_effect": {"latency_reduce": 600, "error_rate_reduce": 8},
      "position_bonus": {"INFRA": 1.8, "BE": 1.1},
      "time_cost_sec": 30,
      "cooldown_sec": 90
    },
    {
      "action_key": "patch",
      "label": "핫픽스: race condition 수정",
      "description": "idempotency key 로직 즉시 패치. BE 고숙련 필요.",
      "kpi_effect": {"error_rate_reduce": 25, "success_rate_add": 20},
      "position_bonus": {"BE": 2.0},
      "time_cost_sec": 90,
      "cooldown_sec": 300,
      "required_position_level": {"BE": 8}
    },
    {
      "action_key": "quarantine",
      "label": "이상 트래픽 격리",
      "description": "retry 폭풍 트래픽 rate limiting. 부하 감소.",
      "kpi_effect": {"latency_reduce": 400, "error_rate_reduce": 5},
      "position_bonus": {"INFRA": 1.5, "BE": 1.3},
      "time_cost_sec": 30,
      "cooldown_sec": 60
    }
  ]'::jsonb
),

-- ──────────────────────────────────────────────────────────────
-- [2] LATENCY-SPIKE: p95 폭증 + 캐시 스탬피드
-- ──────────────────────────────────────────────────────────────
(
  'LATENCY_SPIKE',
  '지연 시간 폭증 & 캐시 스탬피드',
  'incident',
  '서비스 p95 응답시간이 8초를 넘었습니다. 캐시 만료 동시 발생으로 DB에 폭발적 쿼리가 집중되고 있습니다.',
  750,  -- 12.5분
  '{
    "error_rate": 12,
    "latency_p95": 8500,
    "success_rate": 78,
    "deploy_health": 85,
    "target_error_rate": 5,
    "target_success_rate": 92
  }'::jsonb,
  '{
    "error_rate": 5,
    "latency_p95": 500,
    "success_rate": 92,
    "target_error_rate": 5,
    "target_success_rate": 92
  }'::jsonb,
  '[
    {
      "at_sec": 0,
      "event_key": "RAID_LAT_001",
      "title": "p95 8500ms 알람",
      "description": "서비스 전체 p95 응답시간 급등. 유저 이탈율 증가 중.",
      "severity": 4,
      "kpi_delta": {}
    },
    {
      "at_sec": 60,
      "event_key": "RAID_LAT_002",
      "title": "캐시 TTL 만료 동시 발생",
      "description": "Redis TTL이 동일 시각에 집중 만료. DB에 쿼리 10배 증가.",
      "severity": 5,
      "kpi_delta": {"latency_p95": 1000, "error_rate": 5, "success_rate": -5}
    },
    {
      "at_sec": 150,
      "event_key": "RAID_LAT_003",
      "title": "DB CPU 100%",
      "description": "주요 DB 인스턴스 CPU 포화. 슬로우 쿼리 급증.",
      "severity": 5,
      "kpi_delta": {"latency_p95": 2000, "error_rate": 8, "success_rate": -8}
    },
    {
      "at_sec": 240,
      "event_key": "RAID_LAT_004",
      "title": "N+1 쿼리 발견",
      "description": "특정 엔드포인트에서 N+1 패턴 확인. 한 요청이 수백 개의 쿼리 발생.",
      "severity": 4,
      "kpi_delta": {"latency_p95": 500, "error_rate": 2}
    },
    {
      "at_sec": 330,
      "event_key": "RAID_LAT_005",
      "title": "읽기 레플리카 지연",
      "description": "읽기 레플리카 replication lag 30초 초과. 일관성 문제 발생.",
      "severity": 3,
      "kpi_delta": {"error_rate": 3, "latency_p95": 300}
    },
    {
      "at_sec": 420,
      "event_key": "RAID_LAT_006",
      "title": "CDN 원본 서버 부하 전이",
      "description": "CDN 캐시 히트율 감소로 원본 서버로 부하 전이.",
      "severity": 3,
      "kpi_delta": {"latency_p95": 800, "error_rate": 3}
    },
    {
      "at_sec": 510,
      "event_key": "RAID_LAT_007",
      "title": "메모리 스왑 발생",
      "description": "애플리케이션 서버 메모리 부족으로 스왑 사용. 응답속도 추가 악화.",
      "severity": 4,
      "kpi_delta": {"latency_p95": 1000, "error_rate": 4}
    },
    {
      "at_sec": 600,
      "event_key": "RAID_LAT_008",
      "title": "자동 스케일링 지연",
      "description": "오토스케일링 트리거됐으나 부팅 지연으로 5분 소요 예상.",
      "severity": 2,
      "kpi_delta": {}
    },
    {
      "at_sec": 660,
      "event_key": "RAID_LAT_009",
      "title": "신규 인스턴스 온라인",
      "description": "추가 인스턴스 서비스 진입. 부하 분산 시작.",
      "severity": 1,
      "kpi_delta": {"latency_p95": -2000, "error_rate": -5, "success_rate": 5}
    },
    {
      "at_sec": 720,
      "event_key": "RAID_LAT_010",
      "title": "캐시 웜업 완료",
      "description": "캐시 재적재 완료. DB 부하 정상화 시작.",
      "severity": 1,
      "kpi_delta": {"latency_p95": -3000, "error_rate": -3, "success_rate": 8}
    }
  ]'::jsonb,
  '[
    {
      "action_key": "trace",
      "label": "APM 트레이싱",
      "description": "병목 지점 식별. BE/INFRA 숙련 높을수록 정확한 분석.",
      "kpi_effect": {"latency_reduce": 500},
      "position_bonus": {"BE": 1.4, "INFRA": 1.3},
      "time_cost_sec": 30,
      "cooldown_sec": 60
    },
    {
      "action_key": "cache_bust",
      "label": "캐시 재구성",
      "description": "캐시 스탬피드 방지를 위한 jitter TTL 적용 및 프리워밍.",
      "kpi_effect": {"latency_reduce": 3000, "error_rate_reduce": 5},
      "position_bonus": {"BE": 1.8, "INFRA": 1.5},
      "time_cost_sec": 60,
      "cooldown_sec": 120,
      "required_position_level": {"BE": 5}
    },
    {
      "action_key": "scale",
      "label": "수동 스케일 아웃",
      "description": "인스턴스 즉시 추가. INFRA 숙련 높을수록 빠른 부팅.",
      "kpi_effect": {"latency_reduce": 2000, "error_rate_reduce": 4},
      "position_bonus": {"INFRA": 2.0},
      "time_cost_sec": 45,
      "cooldown_sec": 180
    },
    {
      "action_key": "patch",
      "label": "N+1 쿼리 즉시 수정",
      "description": "문제 엔드포인트 쿼리 최적화. BE 고숙련 필요.",
      "kpi_effect": {"latency_reduce": 4000, "error_rate_reduce": 8, "success_rate_add": 10},
      "position_bonus": {"BE": 2.0},
      "time_cost_sec": 120,
      "cooldown_sec": 300,
      "required_position_level": {"BE": 7}
    },
    {
      "action_key": "quarantine",
      "label": "슬로우 엔드포인트 차단",
      "description": "문제 엔드포인트 임시 비활성화. 다른 서비스 보호.",
      "kpi_effect": {"latency_reduce": 1500, "error_rate_reduce": 6},
      "position_bonus": {"INFRA": 1.5, "BE": 1.2},
      "time_cost_sec": 20,
      "cooldown_sec": 60
    },
    {
      "action_key": "alert_tune",
      "label": "읽기 레플리카 전환",
      "description": "읽기 트래픽을 레플리카로 분산. DB 부하 완화.",
      "kpi_effect": {"latency_reduce": 2500, "error_rate_reduce": 5},
      "position_bonus": {"INFRA": 1.8, "BE": 1.4},
      "time_cost_sec": 40,
      "cooldown_sec": 90
    }
  ]'::jsonb
),

-- ──────────────────────────────────────────────────────────────
-- [3] DEPLOY-MELTDOWN: 배포 중 설정 오류 + 롤백/카나리 판단
-- ──────────────────────────────────────────────────────────────
(
  'DEPLOY_MELTDOWN',
  '배포 용융 사고',
  'incident',
  '프로덕션 배포 중 설정 오류로 신규 Pod가 CrashLoopBackOff. 트래픽 절반이 오류 반환 중입니다. 롤백 vs 카나리 유지 결정이 필요합니다.',
  900,  -- 15분
  '{
    "error_rate": 35,
    "latency_p95": 2000,
    "success_rate": 60,
    "deploy_health": 30,
    "target_error_rate": 3,
    "target_success_rate": 97
  }'::jsonb,
  '{
    "error_rate": 3,
    "latency_p95": 600,
    "success_rate": 97,
    "deploy_health": 100,
    "target_error_rate": 3,
    "target_success_rate": 97
  }'::jsonb,
  '[
    {
      "at_sec": 0,
      "event_key": "RAID_DEP_001",
      "title": "Pod CrashLoopBackOff 감지",
      "description": "신규 배포 Pod 50% 크래시. 환경변수 오류 의심.",
      "severity": 5,
      "kpi_delta": {}
    },
    {
      "at_sec": 60,
      "event_key": "RAID_DEP_002",
      "title": "설정 파일 오류 확인",
      "description": "SECRET_KEY 환경변수가 프로덕션에 미주입. 개발 환경에서만 테스트됨.",
      "severity": 4,
      "kpi_delta": {"error_rate": 5, "success_rate": -5}
    },
    {
      "at_sec": 150,
      "event_key": "RAID_DEP_003",
      "title": "헬스체크 실패 cascade",
      "description": "크래시 Pod의 헬스체크 실패로 로드밸런서가 정상 Pod에 과부하.",
      "severity": 4,
      "kpi_delta": {"latency_p95": 500, "error_rate": 3}
    },
    {
      "at_sec": 240,
      "event_key": "RAID_DEP_004",
      "title": "DB 마이그레이션 절반 적용",
      "description": "마이그레이션이 반쯤 실행된 상태. 완전 롤백 시 DB 상태 불일치 위험.",
      "severity": 5,
      "kpi_delta": {}
    },
    {
      "at_sec": 330,
      "event_key": "RAID_DEP_005",
      "title": "카나리 트래픽 분리 실패",
      "description": "카나리 설정 오류로 20% 아닌 50%가 신규 버전으로 라우팅.",
      "severity": 4,
      "kpi_delta": {"error_rate": 5, "success_rate": -5, "deploy_health": -10}
    },
    {
      "at_sec": 420,
      "event_key": "RAID_DEP_006",
      "title": "롤백 vs 핫픽스 결정 순간",
      "description": "롤백하면 DB 불일치, 핫픽스하면 추가 배포 위험. 팀 내 의견 충돌.",
      "severity": 3,
      "kpi_delta": {}
    },
    {
      "at_sec": 510,
      "event_key": "RAID_DEP_007",
      "title": "구버전 Pod 부족",
      "description": "롤백 대상 구버전 이미지가 일부 노드에서 삭제됨. 풀 롤백 불가.",
      "severity": 4,
      "kpi_delta": {}
    },
    {
      "at_sec": 600,
      "event_key": "RAID_DEP_008",
      "title": "긴급 시크릿 주입 시도",
      "description": "Secrets Manager에서 직접 환경변수 주입 시도. INFRA 숙련 필요.",
      "severity": 3,
      "kpi_delta": {}
    },
    {
      "at_sec": 690,
      "event_key": "RAID_DEP_009",
      "title": "일부 Pod 정상화",
      "description": "시크릿 주입 후 신규 Pod 일부 정상 기동 시작.",
      "severity": 2,
      "kpi_delta": {"error_rate": -10, "success_rate": 10, "deploy_health": 20}
    },
    {
      "at_sec": 780,
      "event_key": "RAID_DEP_010",
      "title": "배포 파이프라인 감사 요청",
      "description": "CTO: 배포 전 시크릿 검증 단계가 없었던 이유를 사후 보고서로 제출 요청.",
      "severity": 1,
      "kpi_delta": {}
    }
  ]'::jsonb,
  '[
    {
      "action_key": "rollback",
      "label": "부분 롤백",
      "description": "가능한 Pod만 구버전으로 롤백. DB 불일치 위험 감수.",
      "kpi_effect": {"error_rate_reduce": 20, "success_rate_add": 15, "deploy_health_add": 30},
      "position_bonus": {"INFRA": 2.0, "BE": 1.2},
      "time_cost_sec": 60,
      "cooldown_sec": 180,
      "risk": "DB 스키마 불일치 가능"
    },
    {
      "action_key": "canary",
      "label": "카나리 트래픽 재조정",
      "description": "카나리 비율을 5%로 줄여 피해 최소화.",
      "kpi_effect": {"error_rate_reduce": 15, "success_rate_add": 10},
      "position_bonus": {"INFRA": 1.8, "BE": 1.3},
      "time_cost_sec": 30,
      "cooldown_sec": 90
    },
    {
      "action_key": "patch",
      "label": "환경변수 핫 패치",
      "description": "실행 중인 Pod에 환경변수 직접 주입. INFRA 고숙련 필요.",
      "kpi_effect": {"deploy_health_add": 40, "error_rate_reduce": 25, "success_rate_add": 20},
      "position_bonus": {"INFRA": 2.0},
      "time_cost_sec": 90,
      "cooldown_sec": 240,
      "required_position_level": {"INFRA": 6}
    },
    {
      "action_key": "trace",
      "label": "크래시 로그 분석",
      "description": "Pod 크래시 스택 트레이스 분석. 원인 정확히 파악.",
      "kpi_effect": {"deploy_health_add": 10},
      "position_bonus": {"BE": 1.5, "INFRA": 1.4},
      "time_cost_sec": 30,
      "cooldown_sec": 60
    },
    {
      "action_key": "scale",
      "label": "정상 Pod 증설",
      "description": "구버전 정상 Pod 수를 증가시켜 트래픽 수용.",
      "kpi_effect": {"error_rate_reduce": 10, "success_rate_add": 8, "latency_reduce": 300},
      "position_bonus": {"INFRA": 1.8},
      "time_cost_sec": 45,
      "cooldown_sec": 120
    },
    {
      "action_key": "alert_tune",
      "label": "배포 파이프라인 검증 추가",
      "description": "CI에 시크릿 존재 여부 검증 스텝 즉시 추가. 재발 방지.",
      "kpi_effect": {"deploy_health_add": 15},
      "position_bonus": {"INFRA": 1.5, "QA": 1.8},
      "time_cost_sec": 60,
      "cooldown_sec": 180,
      "required_position_level": {"QA": 4}
    }
  ]'::jsonb
),

-- ──────────────────────────────────────────────────────────────
-- [4] GRAND-LAUNCH: 비동기 런칭 레이드 (48시간, 5단계)
-- ──────────────────────────────────────────────────────────────
(
  'GRAND_LAUNCH',
  '그랜드 런칭 레이드',
  'launch',
  '회사 최대 규모 신규 서비스 런칭입니다. 5개 단계를 팀이 협력하여 완수해야 합니다. 각 단계별 티켓 처리, 품질 보강, 아티팩트 납품으로 기여하세요.',
  172800,  -- 48시간
  '{
    "error_rate": 0,
    "latency_p95": 0,
    "success_rate": 0,
    "deploy_health": 0,
    "target_error_rate": 3,
    "target_success_rate": 97
  }'::jsonb,
  '{
    "error_rate": 3,
    "latency_p95": 400,
    "success_rate": 97,
    "deploy_health": 100,
    "target_error_rate": 3,
    "target_success_rate": 97
  }'::jsonb,
  '[
    {
      "phase": 1,
      "name": "설계 & 계획",
      "duration_hours": 8,
      "objective": "티켓 8개 처리 + plan_scroll 5개 납품 + 품질 점수 70 이상",
      "tickets_required": 8,
      "quality_target": 70,
      "artifacts_required": {"plan_scroll": 5},
      "reward": {"credits_per_member": 200, "xp_bonus": {"core": {"design": 50}}},
      "description": "API 계약서 작성, 데이터 모델 정의, UX 와이어프레임, 리스크 레지스터"
    },
    {
      "phase": 2,
      "name": "핵심 구현",
      "duration_hours": 12,
      "objective": "티켓 15개 처리 + circuit_board 8개 납품 + 품질 점수 75 이상",
      "tickets_required": 15,
      "quality_target": 75,
      "artifacts_required": {"circuit_board": 8},
      "reward": {"credits_per_member": 300, "xp_bonus": {"position": {"BE": 100, "FE": 100}}},
      "description": "인증/인가, 핵심 비즈니스 로직, API 엔드포인트, 프론트엔드 핵심 화면"
    },
    {
      "phase": 3,
      "name": "테스트 & 품질 강화",
      "duration_hours": 10,
      "objective": "티켓 12개 처리 + test_crystal 6개 납품 + 품질 점수 80 이상",
      "tickets_required": 12,
      "quality_target": 80,
      "artifacts_required": {"test_crystal": 6},
      "reward": {"credits_per_member": 250, "xp_bonus": {"position": {"QA": 150}, "core": {"debugging": 50}}},
      "description": "통합 테스트, E2E 테스트, 성능 테스트, 보안 스캔, 버그 수정"
    },
    {
      "phase": 4,
      "name": "인프라 & 배포 준비",
      "duration_hours": 10,
      "objective": "티켓 10개 처리 + deploy_key 4개 + infra_node 3개 납품 + deploy_health 90 이상",
      "tickets_required": 10,
      "quality_target": 85,
      "artifacts_required": {"deploy_key": 4, "infra_node": 3},
      "reward": {"credits_per_member": 280, "xp_bonus": {"position": {"INFRA": 150}, "core": {"delivery": 50}}},
      "description": "프로덕션 인프라 구성, 배포 파이프라인, 롤백 계획, 모니터링 설정"
    },
    {
      "phase": 5,
      "name": "런칭 & 안정화",
      "duration_hours": 8,
      "objective": "카나리 배포 완료 + error_rate < 3% + success_rate > 97% + 전체 팀 기여",
      "tickets_required": 5,
      "quality_target": 90,
      "artifacts_required": {},
      "reward": {
        "credits_per_member": 500,
        "title_key": "grand_launcher",
        "xp_bonus": {"core": {"collaboration": 100, "delivery": 100}}
      },
      "description": "점진적 트래픽 증가, 실시간 모니터링, 이상 징후 대응, 런칭 완료 선언"
    }
  ]'::jsonb,
  '[
    {
      "action_key": "trace",
      "label": "런칭 트래픽 모니터링",
      "description": "실시간 트래픽 및 에러 추적."
    },
    {
      "action_key": "canary",
      "label": "카나리 배포",
      "description": "단계적 트래픽 증가: 5% → 20% → 50% → 100%."
    },
    {
      "action_key": "rollback",
      "label": "긴급 롤백",
      "description": "런칭 중 심각한 오류 시 즉시 롤백."
    },
    {
      "action_key": "scale",
      "label": "오토스케일링 튜닝",
      "description": "실시간 트래픽에 맞게 인프라 조정."
    },
    {
      "action_key": "alert_tune",
      "label": "알람 임계값 조정",
      "description": "런칭 초기 노이즈 알람 억제 및 핵심 알람 강화."
    }
  ]'::jsonb
);
