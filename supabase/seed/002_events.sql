-- STACKWORLD RPG: Events Seed Data (80 events)
-- Phase별 16개씩: plan(16), implement(16), test(16), deploy(16), operate(16)

INSERT INTO public.events (event_key, phase, severity, title, description, choices, tags)
VALUES

-- ============================================================
-- PLAN PHASE (16개)
-- ============================================================
  ('EVT_PLAN_001', 'plan', 3, '요구사항 변경 폭탄',
   '스프린트 중반, 클라이언트가 핵심 기능 요구사항을 전면 수정하겠다고 통보했다. 팀 전체가 혼란에 빠졌다.',
   '[
     {"label": "요구사항 재협상", "description": "PO와 클라이언트 간 긴급 회의를 소집해 범위를 재협상한다.", "time_delta": 5, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "임팩트 분석 실행", "description": "변경 범위의 임팩트를 정밀 분석해 우선순위를 재조정한다.", "required_command": "trace", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "그냥 다 받아들이기", "description": "요구사항을 모두 수용하고 야근으로 처리한다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['scope','change','requirements','stakeholder']),

  ('EVT_PLAN_002', 'plan', 4, '이해관계자 간 목표 충돌',
   'CTO는 기술 부채 청산을, CMO는 신기능 빠른 출시를 원한다. 두 방향이 정면으로 충돌하고 있다.',
   '[
     {"label": "워크숍 진행", "description": "이해관계자 전체를 모아 목표 정렬 워크숍을 진행한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.15},
     {"label": "OKR 기반 중재", "description": "OKR 프레임워크로 양측 목표를 수치화해 합의점을 찾는다.", "required_command": "plan", "time_delta": 2, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "CTO 편 들기", "description": "CTO의 의견만 따르고 CMO 요구는 다음 분기로 미룬다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['stakeholder','conflict','planning','alignment']),

  ('EVT_PLAN_003', 'plan', 2, '기술 스택 선택 논쟁',
   '팀 내 백엔드 개발자들이 Go vs Node.js를 두고 격렬하게 논쟁 중이다. 결정이 미뤄지면서 일정이 지연되고 있다.',
   '[
     {"label": "POC 진행", "description": "양쪽 스택으로 간단한 POC를 만들고 성능을 비교한다.", "time_delta": 3, "risk_delta": -1, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "RFC 문서 작성", "description": "RFC 형식으로 장단점을 문서화하고 투표로 결정한다.", "required_command": "document", "time_delta": 2, "risk_delta": -2, "debt_delta": -1, "quality_delta": 1},
     {"label": "팀장이 독단 결정", "description": "논의를 끝내고 팀장이 즉시 결정을 내린다.", "time_delta": -3, "risk_delta": 2, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['tech-stack','decision','team','architecture']),

  ('EVT_PLAN_004', 'plan', 3, '일정 압박 — 데드라인 단축',
   '경영진이 출시일을 3주 앞당기라고 지시했다. 현재 로드맵으로는 불가능에 가깝다.',
   '[
     {"label": "범위 축소 협의", "description": "MVP 범위를 줄여 핵심 기능만 제때 출시하는 계획을 제안한다.", "time_delta": 0, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "리소스 증원 요청", "description": "임시 인력을 투입해 일정을 맞추는 방안을 제안한다.", "required_command": "escalate", "time_delta": 1, "risk_delta": -1, "debt_delta": 1, "quality_delta": 0},
     {"label": "강행군 수용", "description": "모든 팀원이 데드라인을 맞추기 위해 초과근무한다.", "time_delta": -3, "risk_delta": 4, "debt_delta": 3, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['deadline','schedule','pressure','management']),

  ('EVT_PLAN_005', 'plan', 4, '예상치 못한 레거시 시스템 연동 발견',
   '계획 단계에서 20년 된 레거시 COBOL 시스템과 연동해야 한다는 사실이 뒤늦게 밝혀졌다.',
   '[
     {"label": "레거시 전문가 확보", "description": "레거시 시스템 전문가를 컨설턴트로 고용해 분석을 맡긴다.", "time_delta": 6, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "어댑터 레이어 설계", "description": "레거시와 신규 시스템 사이에 어댑터 레이어를 설계한다.", "required_command": "design", "time_delta": 4, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "직접 연동 강행", "description": "레거시 시스템에 직접 연결하는 임시 코드를 작성한다.", "time_delta": -1, "risk_delta": 5, "debt_delta": 4, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['legacy','integration','architecture','risk']),

  ('EVT_PLAN_006', 'plan', 2, '팀원 갑작스러운 퇴사',
   '핵심 아키텍트가 갑자기 퇴사 의사를 밝혔다. 2주 뒤면 팀을 떠난다.',
   '[
     {"label": "지식 이전 세션 개최", "description": "남은 2주 동안 집중 지식 이전 세션을 진행한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "문서화 스프린트", "description": "아키텍트가 모든 핵심 설계를 문서로 남기는 스프린트를 진행한다.", "required_command": "document", "time_delta": 1, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "무시하고 진행", "description": "빠른 채용을 기대하며 현재 계획대로 진행한다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['team','personnel','knowledge','risk']),

  ('EVT_PLAN_007', 'plan', 3, '경쟁사 유사 제품 출시',
   '계획 중인 기능과 거의 동일한 제품을 경쟁사가 먼저 출시했다는 소식이 들어왔다.',
   '[
     {"label": "차별화 전략 수립", "description": "경쟁사 제품을 분석하고 차별화 포인트를 새롭게 정의한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.15},
     {"label": "시장 조사 실시", "description": "사용자 인터뷰로 경쟁사 제품의 약점을 파악한다.", "required_command": "research", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "가격 경쟁으로 맞대응", "description": "기능보다 가격을 낮춰 빠르게 시장에 진입한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['competition','strategy','market','planning']),

  ('EVT_PLAN_008', 'plan', 1, '스프린트 의식 부재',
   '팀이 스프린트 계획, 리뷰, 회고 등 애자일 의식을 제대로 수행하지 않아 방향이 흐트러지고 있다.',
   '[
     {"label": "스크럼 마스터 지정", "description": "전담 스크럼 마스터를 지정해 의식을 정상화한다.", "time_delta": 2, "risk_delta": -1, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "팀 코칭 세션", "description": "외부 애자일 코치를 초빙해 팀 전체를 교육한다.", "required_command": "coach", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "형식 없이 진행", "description": "의식 없이 자유롭게 일하고 결과로만 평가한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['agile','process','team','scrum']),

  ('EVT_PLAN_009', 'plan', 4, '규제 준수 요건 추가 발견',
   '출시 전 GDPR 및 개인정보보호법 준수 요건이 새롭게 추가되어 아키텍처 변경이 불가피하다.',
   '[
     {"label": "법무팀 협의", "description": "법무팀과 함께 규제 요건을 파악하고 대응 계획을 수립한다.", "time_delta": 5, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "규제 전문가 감사", "description": "규제 전문가를 고용해 현재 아키텍처를 감사받는다.", "required_command": "audit", "time_delta": 4, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "최소한만 대응", "description": "가장 간단한 규제 대응만 적용하고 출시를 강행한다.", "time_delta": -2, "risk_delta": 5, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['compliance','gdpr','regulation','architecture']),

  ('EVT_PLAN_010', 'plan', 2, '불명확한 성공 지표',
   '팀 내에서 이 프로젝트의 성공을 어떻게 측정할지 기준이 없어 방향성 논쟁이 반복되고 있다.',
   '[
     {"label": "KPI 정의 워크숍", "description": "팀 전체가 모여 측정 가능한 KPI를 함께 정의한다.", "time_delta": 2, "risk_delta": -1, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "데이터 기반 OKR 설정", "description": "기존 데이터를 분석해 현실적인 OKR을 설정한다.", "required_command": "analyze", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "감에 의존", "description": "KPI 없이 팀의 직관으로 성공을 판단하기로 한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['kpi','measurement','planning','alignment']),

  ('EVT_PLAN_011', 'plan', 3, '외부 API 제공사 정책 변경',
   '핵심 기능에 사용하는 서드파티 API가 요금 정책을 대폭 변경했다. 기존 계획으로는 비용이 10배 증가한다.',
   '[
     {"label": "대안 API 탐색", "description": "동일 기능을 제공하는 대안 API를 조사하고 마이그레이션을 계획한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "자체 구현 검토", "description": "외부 API 의존성을 제거하고 자체 구현 가능성을 분석한다.", "required_command": "evaluate", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "비용 그냥 수용", "description": "높은 비용을 감수하고 기존 API를 계속 사용한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 2, "quality_delta": 0}
   ]'::jsonb,
   ARRAY['api','vendor','cost','dependency']),

  ('EVT_PLAN_012', 'plan', 2, '팀 역량 부족 발견',
   '계획된 기술(예: ML 파이프라인)을 팀 내 누구도 실제로 구현해본 경험이 없다는 것이 밝혀졌다.',
   '[
     {"label": "교육 스프린트 편성", "description": "전문 교육 스프린트를 편성해 팀 역량을 키운다.", "time_delta": 5, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "전문가 채용", "description": "해당 분야 전문가를 채용하거나 컨설팅을 받는다.", "required_command": "hire", "time_delta": 4, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2},
     {"label": "독학으로 강행", "description": "팀원들이 스스로 배우면서 개발을 진행한다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['skill','team','training','risk']),

  ('EVT_PLAN_013', 'plan', 5, '예산 삭감 통보',
   '프로젝트 예산이 갑자기 30% 삭감되었다. 현재 계획된 인프라와 라이선스 비용을 감당할 수 없다.',
   '[
     {"label": "우선순위 재조정", "description": "예산 내에서 가장 중요한 기능에 집중하도록 계획을 재조정한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "오픈소스 대체재 탐색", "description": "유료 도구를 오픈소스 대체재로 교체해 비용을 절감한다.", "required_command": "optimize", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 1},
     {"label": "예산 복구 기도", "description": "예산이 복구될 것을 기대하며 현재 계획을 유지한다.", "time_delta": -2, "risk_delta": 5, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['budget','cost','planning','risk']),

  ('EVT_PLAN_014', 'plan', 3, '마이크로서비스 vs 모놀리스 논쟁',
   '아키텍처 방향을 두고 팀이 마이크로서비스와 모놀리스로 나뉘어 결론을 내리지 못하고 있다.',
   '[
     {"label": "모듈러 모놀리스 채택", "description": "당장은 모놀리스로 시작하고 필요 시 분리 가능한 구조를 유지한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "ADR 작성 후 결정", "description": "Architecture Decision Record를 작성해 근거 있는 결정을 내린다.", "required_command": "document", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "처음부터 마이크로서비스", "description": "복잡도를 감수하고 처음부터 마이크로서비스로 구성한다.", "time_delta": -3, "risk_delta": 4, "debt_delta": 4, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['architecture','microservices','monolith','decision']),

  ('EVT_PLAN_015', 'plan', 2, '스프린트 속도 과대 추정',
   '팀이 이전 스프린트 속도를 과대 계상해 이번 스프린트 계획이 현실과 크게 괴리되어 있다.',
   '[
     {"label": "속도 재측정", "description": "실제 완료된 스토리 포인트를 기반으로 속도를 재계산한다.", "time_delta": 1, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "버퍼 추가 계획", "description": "앞으로 모든 스프린트에 20% 버퍼를 추가한 계획을 수립한다.", "required_command": "plan", "time_delta": 2, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "현재 계획 고수", "description": "팀이 더 열심히 하면 된다며 계획을 바꾸지 않는다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['velocity','estimation','agile','planning']),

  ('EVT_PLAN_016', 'plan', 4, '데이터 마이그레이션 리스크 발견',
   '기존 레거시 DB에서 신규 시스템으로 데이터를 이전해야 하는데, 데이터 품질 문제가 심각하다는 것이 발견됐다.',
   '[
     {"label": "데이터 감사 실시", "description": "전체 데이터를 감사하고 정제 전략을 수립한다.", "time_delta": 6, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "ETL 파이프라인 설계", "description": "자동 데이터 변환 및 검증 파이프라인을 설계한다.", "required_command": "design", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "있는 그대로 이전", "description": "데이터 품질 문제를 무시하고 그대로 마이그레이션한다.", "time_delta": -3, "risk_delta": 5, "debt_delta": 4, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['data','migration','quality','risk']),

-- ============================================================
-- IMPLEMENT PHASE (16개)
-- ============================================================
  ('EVT_IMPL_001', 'implement', 4, '의존성 취약점 발견',
   'npm audit 결과 사용 중인 핵심 라이브러리에 CVE 등급 CRITICAL 취약점이 발견됐다.',
   '[
     {"label": "즉시 패치 적용", "description": "취약한 라이브러리를 최신 패치 버전으로 즉시 업데이트한다.", "time_delta": 2, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "취약점 전수 분석", "description": "전체 의존성 트리를 분석하고 대체 라이브러리를 검토한다.", "required_command": "audit", "time_delta": 3, "risk_delta": -4, "debt_delta": -1, "quality_delta": 2},
     {"label": "나중에 처리", "description": "현재 기능 구현을 마치고 나중에 취약점을 처리한다.", "time_delta": -2, "risk_delta": 5, "debt_delta": 3, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['security','vulnerability','dependency','npm']),

  ('EVT_IMPL_002', 'implement', 3, 'API 응답 성능 병목',
   '특정 API 엔드포인트의 응답 시간이 3초를 넘는다. 원인을 파악하지 못한 상태다.',
   '[
     {"label": "프로파일링 실행", "description": "APM 도구로 병목 구간을 프로파일링하고 최적화한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "쿼리 최적화", "description": "slow query log를 분석해 N+1 문제와 인덱스를 최적화한다.", "required_command": "optimize", "time_delta": 2, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "캐시로 임시 해결", "description": "원인 파악 없이 Redis 캐시를 덧씌워 임시 해결한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 3, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['performance','api','bottleneck','optimization']),

  ('EVT_IMPL_003', 'implement', 4, '메모리 누수 발생',
   '장기 실행 후 서버 메모리 사용량이 계속 증가한다. 24시간 후 OOM으로 프로세스가 죽는 것이 확인됐다.',
   '[
     {"label": "힙 덤프 분석", "description": "힙 덤프를 캡처하고 메모리 누수 원인을 분석한다.", "time_delta": 4, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "이벤트 리스너 감사", "description": "이벤트 리스너와 클로저를 전수 검사해 참조 누수를 찾는다.", "required_command": "trace", "time_delta": 3, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "주기적 재시작", "description": "24시간마다 서버를 재시작하는 cron job으로 임시 해결한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 4, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['memory','leak','performance','stability']),

  ('EVT_IMPL_004', 'implement', 5, '경쟁 조건 버그 발생',
   '동시 요청 처리 시 데이터가 꼬이는 경쟁 조건(Race Condition) 버그가 발견됐다. 간헐적으로 발생해 재현이 어렵다.',
   '[
     {"label": "뮤텍스 락 적용", "description": "임계 구역을 식별하고 적절한 락 메커니즘을 적용한다.", "time_delta": 5, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "분산 락 설계", "description": "Redis 기반 분산 락을 설계해 멀티 인스턴스 환경도 안전하게 처리한다.", "required_command": "design", "time_delta": 4, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "재시도 로직 추가", "description": "충돌 감지 후 자동 재시도하는 로직을 추가한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 3, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['concurrency','race-condition','bug','thread-safety']),

  ('EVT_IMPL_005', 'implement', 3, 'API 스펙 불일치',
   '프론트엔드가 기대하는 API 응답 형식과 백엔드 구현이 달라 개발이 블로킹된 상태다.',
   '[
     {"label": "API 계약 정의", "description": "OpenAPI 스펙으로 계약을 명확히 정의하고 양쪽이 따르도록 한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "Mock 서버 운영", "description": "MSW 등으로 Mock 서버를 구성해 프론트엔드 개발이 계속되게 한다.", "required_command": "mock", "time_delta": 1, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "한쪽이 맞추기", "description": "프론트엔드가 백엔드 응답에 맞게 코드를 수정한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 3, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['api','contract','frontend','backend']),

  ('EVT_IMPL_006', 'implement', 2, '코드 리뷰 병목',
   'PR이 리뷰 대기 상태로 쌓여 평균 리뷰 대기 시간이 3일을 넘었다. 개발 흐름이 끊기고 있다.',
   '[
     {"label": "리뷰어 순번제 도입", "description": "리뷰어 순번제와 24시간 응답 SLA를 도입한다.", "time_delta": 1, "risk_delta": -1, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "페어 리뷰 세션", "description": "주 2회 페어 리뷰 세션으로 PR 적체를 해소한다.", "required_command": "review", "time_delta": 2, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "리뷰 없이 머지", "description": "급한 PR은 리뷰 없이 바로 머지하는 정책을 임시 적용한다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['code-review','process','productivity','team']),

  ('EVT_IMPL_007', 'implement', 3, '서드파티 SDK 버그 발견',
   '결제 처리에 사용하는 서드파티 SDK에서 특정 조건에서 실패하는 버그가 발견됐다.',
   '[
     {"label": "SDK 제공사 이슈 리포트", "description": "이슈를 제공사에 리포트하고 핫픽스를 요청한다.", "time_delta": 5, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "래퍼 레이어 구현", "description": "SDK 위에 래퍼 레이어를 구현해 버그를 우회하는 로직을 추가한다.", "required_command": "implement", "time_delta": 3, "risk_delta": -3, "debt_delta": 1, "quality_delta": 2},
     {"label": "SDK 버전 다운그레이드", "description": "버그가 없는 이전 버전으로 다운그레이드한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['sdk','third-party','bug','payment']),

  ('EVT_IMPL_008', 'implement', 4, 'DB 스키마 설계 오류 발견',
   '이미 절반이 구현된 시점에 초기 DB 스키마 설계에 근본적인 오류가 있다는 것이 발견됐다.',
   '[
     {"label": "스키마 리팩터링", "description": "올바른 스키마로 수정하고 관련 코드를 모두 업데이트한다.", "time_delta": 6, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "마이그레이션 전략 설계", "description": "점진적 마이그레이션으로 기존 코드 영향을 최소화한다.", "required_command": "migrate", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "현 스키마 유지", "description": "설계 오류를 애플리케이션 레이어에서 우회하며 유지한다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 5, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['database','schema','refactoring','design']),

  ('EVT_IMPL_009', 'implement', 2, '환경 설정 불일치',
   '로컬, 스테이징, 프로덕션 환경의 설정이 달라 "로컬에서는 되는데" 문제가 빈번히 발생한다.',
   '[
     {"label": "IaC 도입", "description": "Terraform/Pulumi로 모든 환경을 코드로 관리하는 체계를 수립한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "컨테이너화 통일", "description": "Docker Compose로 로컬 환경을 프로덕션과 동일하게 맞춘다.", "required_command": "containerize", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "환경별 README 작성", "description": "각 환경 설정을 README에 문서화하고 수동으로 맞추게 한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['environment','configuration','devops','consistency']),

  ('EVT_IMPL_010', 'implement', 3, '무한 재귀 버그',
   '특정 입력값에서 함수가 무한 재귀에 빠져 스택 오버플로우가 발생하는 버그가 발견됐다.',
   '[
     {"label": "재귀 깊이 제한 추가", "description": "최대 재귀 깊이 제한과 종료 조건을 명확히 추가한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "반복문으로 리팩터링", "description": "재귀 로직을 명시적 스택을 사용한 반복문으로 변환한다.", "required_command": "refactor", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "타임아웃만 추가", "description": "재귀 함수에 타임아웃만 걸어 무한 루프를 방지한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['bug','recursion','stack-overflow','algorithm']),

  ('EVT_IMPL_011', 'implement', 4, 'XSS 취약점 발견',
   '코드 리뷰 중 사용자 입력값이 그대로 DOM에 삽입되는 XSS 취약점이 여러 곳에서 발견됐다.',
   '[
     {"label": "입력값 전수 점검", "description": "모든 사용자 입력 처리 코드를 점검하고 sanitization을 추가한다.", "time_delta": 4, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "CSP 헤더 적용", "description": "Content-Security-Policy 헤더와 DOMPurify를 함께 적용한다.", "required_command": "secure", "time_delta": 3, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "프론트에만 처리", "description": "서버 검증 없이 프론트엔드에서만 입력값을 필터링한다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['security','xss','vulnerability','frontend']),

  ('EVT_IMPL_012', 'implement', 2, '타입스크립트 any 남용',
   '코드베이스 전반에 TypeScript `any` 타입이 남발되어 타입 안전성이 사실상 무력화되었다.',
   '[
     {"label": "strict 모드 활성화", "description": "tsconfig의 strict 모드를 켜고 any를 점진적으로 제거한다.", "time_delta": 4, "risk_delta": -1, "debt_delta": -2, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "타입 생성 자동화", "description": "API 응답에서 타입을 자동 생성하는 codegen을 도입한다.", "required_command": "generate", "time_delta": 3, "risk_delta": -2, "debt_delta": -2, "quality_delta": 3},
     {"label": "any 허용 주석 추가", "description": "eslint-disable로 경고를 억제하고 현재 코드를 유지한다.", "time_delta": -2, "risk_delta": 2, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['typescript','type-safety','code-quality','refactoring']),

  ('EVT_IMPL_013', 'implement', 3, 'N+1 쿼리 문제',
   'ORM 사용 중 N+1 쿼리 문제가 발생해 사용자가 100명만 넘어도 응답 시간이 급증한다.',
   '[
     {"label": "Eager Loading 적용", "description": "연관 엔티티를 Eager Loading으로 한 번에 조회하도록 수정한다.", "time_delta": 2, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "DataLoader 패턴 도입", "description": "DataLoader 패턴으로 배치 처리를 구현해 쿼리 수를 최소화한다.", "required_command": "optimize", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "페이지네이션으로 회피", "description": "페이지 크기를 줄여 N+1 문제의 영향을 제한한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['database','orm','performance','query']),

  ('EVT_IMPL_014', 'implement', 3, '인증 토큰 만료 처리 누락',
   'JWT 토큰 만료 시 사용자가 로그아웃되지 않고 오류 화면이 노출되는 버그가 발견됐다.',
   '[
     {"label": "리프레시 토큰 구현", "description": "리프레시 토큰 메커니즘을 구현해 자동 갱신 처리를 추가한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "인터셉터 추가", "description": "HTTP 인터셉터에서 401 응답을 감지해 자동 로그아웃 처리한다.", "required_command": "implement", "time_delta": 2, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "토큰 만료 시간 연장", "description": "토큰 만료 시간을 30일로 늘려 문제 발생 빈도를 줄인다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['auth','jwt','security','frontend']),

  ('EVT_IMPL_015', 'implement', 4, 'WebSocket 연결 불안정',
   '실시간 기능 구현에 사용하는 WebSocket 연결이 일정 시간마다 끊기는 현상이 발생한다.',
   '[
     {"label": "Heartbeat 구현", "description": "주기적인 ping/pong heartbeat으로 연결을 유지하는 메커니즘을 추가한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "자동 재연결 로직", "description": "지수 백오프 방식의 자동 재연결 로직을 구현한다.", "required_command": "implement", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "SSE로 교체", "description": "WebSocket을 Server-Sent Events로 교체해 문제를 우회한다.", "time_delta": -2, "risk_delta": 2, "debt_delta": 3, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['websocket','realtime','connectivity','network']),

  ('EVT_IMPL_016', 'implement', 2, '테스트 없는 레거시 코드 수정',
   '테스트가 전혀 없는 레거시 코드를 수정해야 한다. 무엇을 건드려도 사이드 이펙트가 우려된다.',
   '[
     {"label": "특성화 테스트 작성", "description": "현재 동작을 문서화하는 특성화 테스트를 먼저 작성한다.", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "안전망 테스트 후 리팩터링", "description": "E2E 테스트로 안전망을 구축한 뒤 조심스럽게 리팩터링한다.", "required_command": "test", "time_delta": 5, "risk_delta": -4, "debt_delta": -2, "quality_delta": 3},
     {"label": "테스트 없이 직접 수정", "description": "신중하게 수정하면 괜찮을 거라는 판단으로 바로 수정한다.", "time_delta": -3, "risk_delta": 5, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['legacy','testing','refactoring','risk']),

-- ============================================================
-- TEST PHASE (16개)
-- ============================================================
  ('EVT_TEST_001', 'test', 4, '재현 불가 버그',
   'QA에서 보고한 버그가 개발 환경에서 전혀 재현되지 않는다. 프로덕션에서는 간헐적으로 발생한다.',
   '[
     {"label": "환경 동기화", "description": "프로덕션 환경 변수와 데이터를 스테이징에 최대한 동기화한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "분산 트레이싱 분석", "description": "프로덕션 트레이스 로그를 분석해 버그 발생 패턴을 찾는다.", "required_command": "trace", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "방어 코드 추가", "description": "버그 원인을 모른 채 예외 처리 코드를 추가해 증상을 숨긴다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['bug','reproduction','testing','debugging']),

  ('EVT_TEST_002', 'test', 2, '플레이키 테스트 급증',
   'CI에서 간헐적으로 실패하는 Flaky 테스트가 20개를 넘어섰다. 빌드 성공 여부를 신뢰할 수 없다.',
   '[
     {"label": "플레이키 테스트 격리", "description": "플레이키 테스트를 별도 스위트로 격리하고 원인을 분석한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "재시도 로직 제거 후 수정", "description": "재시도 로직을 제거하고 테스트 자체의 결정론성을 확보한다.", "required_command": "fix", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "재시도 횟수 늘리기", "description": "플레이키 테스트에 재시도를 5회로 늘려 통과율을 높인다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['flaky-test','ci','reliability','testing']),

  ('EVT_TEST_003', 'test', 3, '테스트 환경 장애',
   '스테이징 환경 DB가 손상되어 QA 팀 전체가 테스트를 진행할 수 없는 상황이 됐다.',
   '[
     {"label": "환경 재구축", "description": "IaC 스크립트로 스테이징 환경을 처음부터 재구축한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "DB 스냅샷 복구", "description": "최근 스냅샷에서 DB를 복구하고 원인을 분석한다.", "required_command": "restore", "time_delta": 1, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "로컬 환경에서 테스트", "description": "QA 팀이 각자 로컬에서 테스트를 진행하도록 안내한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['environment','qa','database','incident']),

  ('EVT_TEST_004', 'test', 3, '테스트 커버리지 미달',
   '릴리즈 기준인 80% 커버리지에 현재 커버리지가 55%에 머물러 있다.',
   '[
     {"label": "커버리지 스프린트", "description": "릴리즈 전 전담 커버리지 스프린트를 진행한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "핵심 경로 우선 커버", "description": "비즈니스 핵심 경로에 집중해 의미 있는 테스트를 추가한다.", "required_command": "test", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "커버리지 기준 낮추기", "description": "릴리즈 기준을 60%로 낮추고 출시한다.", "time_delta": -3, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['coverage','testing','quality','release']),

  ('EVT_TEST_005', 'test', 4, '테스트 데이터 오염',
   '공유 스테이징 DB에서 테스트 데이터가 뒤섞여 QA 결과를 신뢰할 수 없는 상태가 됐다.',
   '[
     {"label": "테스트 데이터 격리", "description": "각 테스트 케이스가 독립적인 데이터를 사용하도록 픽스처를 재설계한다.", "time_delta": 4, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "테스트 전용 DB 구성", "description": "QA 전용 격리 DB를 구성하고 테스트 후 자동 초기화한다.", "required_command": "setup", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "데이터 정리 후 재개", "description": "현재 데이터를 수동 정리하고 주의하며 테스트를 재개한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['test-data','isolation','qa','database']),

  ('EVT_TEST_006', 'test', 2, '성능 테스트 미실시',
   '기능 테스트는 통과했지만 성능 테스트가 전혀 이루어지지 않은 채 릴리즈가 임박했다.',
   '[
     {"label": "부하 테스트 실시", "description": "k6 또는 Locust로 예상 부하의 2배 시나리오를 테스트한다.", "time_delta": 3, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "프로덕션 트래픽 분석", "description": "기존 서비스 트래픽 패턴을 분석해 현실적인 부하 시나리오를 설계한다.", "required_command": "analyze", "time_delta": 2, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "모니터링만 강화", "description": "성능 테스트 대신 프로덕션 모니터링을 강화하고 출시한다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['performance','load-testing','release','risk']),

  ('EVT_TEST_007', 'test', 3, '모바일 브라우저 호환성 문제',
   '데스크톱에서 정상 동작하는 기능이 iOS Safari에서 깨지는 것이 QA에서 발견됐다.',
   '[
     {"label": "크로스 브라우저 테스트 추가", "description": "BrowserStack으로 주요 브라우저/OS 조합을 자동 테스트한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "폴리필 추가", "description": "미지원 API에 대한 폴리필을 추가하고 CSS 벤더 프리픽스를 적용한다.", "required_command": "fix", "time_delta": 2, "risk_delta": -3, "debt_delta": 1, "quality_delta": 2},
     {"label": "iOS Safari 미지원 공지", "description": "iOS Safari를 미지원 브라우저로 명시하고 Chrome을 권장한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 0, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['browser','compatibility','mobile','frontend']),

  ('EVT_TEST_008', 'test', 4, '보안 취약점 스캔 결과',
   'OWASP ZAP 스캔 결과 SQL Injection과 IDOR 취약점이 발견됐다.',
   '[
     {"label": "즉시 패치 및 재스캔", "description": "발견된 취약점을 즉시 수정하고 재스캔으로 검증한다.", "time_delta": 5, "risk_delta": -4, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "보안 코드 리뷰", "description": "전체 코드베이스에 대한 보안 중심 코드 리뷰를 진행한다.", "required_command": "audit", "time_delta": 4, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "WAF로 임시 방어", "description": "코드 수정 대신 WAF 규칙으로 공격을 임시 차단한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 3, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['security','vulnerability','owasp','sql-injection']),

  ('EVT_TEST_009', 'test', 2, 'E2E 테스트 속도 저하',
   'E2E 테스트 스위트 실행에 45분이 걸려 CI 파이프라인이 너무 느려졌다.',
   '[
     {"label": "테스트 병렬화", "description": "E2E 테스트를 여러 워커로 병렬 실행하도록 구성한다.", "time_delta": 2, "risk_delta": -1, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "테스트 선택 실행", "description": "변경된 영역에만 관련 E2E 테스트를 실행하는 스마트 선택 전략을 적용한다.", "required_command": "optimize", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "E2E 테스트 건너뛰기", "description": "빠른 피드백을 위해 PR마다 E2E 테스트를 생략한다.", "time_delta": -3, "risk_delta": 4, "debt_delta": 2, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['e2e','ci','performance','testing']),

  ('EVT_TEST_010', 'test', 3, '접근성 테스트 실패',
   '접근성 자동화 테스트에서 스크린 리더 호환성 문제가 다수 발견됐다.',
   '[
     {"label": "접근성 수정 스프린트", "description": "WCAG 2.1 AA 기준으로 접근성 문제를 체계적으로 수정한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "접근성 감사 도입", "description": "axe-core를 CI에 통합해 접근성 회귀를 자동으로 방지한다.", "required_command": "audit", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "접근성 보류", "description": "접근성 수정을 다음 릴리즈로 미루고 현재 버전을 출시한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['accessibility','wcag','testing','quality']),

  ('EVT_TEST_011', 'test', 4, '결제 시나리오 테스트 실패',
   '결제 테스트 시나리오에서 부분 환불 케이스가 실패하고 있다. 운영 중 발생하면 치명적이다.',
   '[
     {"label": "결제 로직 전면 재검토", "description": "결제 관련 비즈니스 로직 전체를 재검토하고 엣지 케이스를 추가한다.", "time_delta": 5, "risk_delta": -4, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "PG사 샌드박스 검증", "description": "PG사의 공식 샌드박스로 모든 결제 시나리오를 검증한다.", "required_command": "verify", "time_delta": 4, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "해당 기능 비활성화", "description": "부분 환불 기능을 비활성화하고 출시 후 빠르게 수정한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['payment','testing','critical','edge-case']),

  ('EVT_TEST_012', 'test', 2, '테스트 문서 부재',
   '테스트 계획서와 케이스가 문서화되지 않아 QA 팀이 매번 같은 테스트를 반복하거나 누락한다.',
   '[
     {"label": "테스트 계획서 작성", "description": "표준 템플릿으로 테스트 계획서와 체크리스트를 작성한다.", "time_delta": 3, "risk_delta": -1, "debt_delta": -1, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "테스트 관리 도구 도입", "description": "TestRail 등 테스트 관리 도구를 도입해 체계적으로 관리한다.", "required_command": "document", "time_delta": 4, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "QA 경험에 의존", "description": "베테랑 QA의 경험에 의존하고 문서화는 나중으로 미룬다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['documentation','qa','process','testing']),

  ('EVT_TEST_013', 'test', 3, '마이그레이션 후 데이터 정합성 오류',
   '스테이징에서 데이터 마이그레이션 후 일부 레코드의 외래 키가 깨진 것이 발견됐다.',
   '[
     {"label": "정합성 검증 스크립트 작성", "description": "마이그레이션 전후 데이터 정합성을 자동 검증하는 스크립트를 작성한다.", "time_delta": 3, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "마이그레이션 롤백 후 재설계", "description": "마이그레이션을 롤백하고 결함 있는 마이그레이션 스크립트를 수정한다.", "required_command": "rollback", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "수동 데이터 수정", "description": "깨진 레코드를 수동으로 수정하고 마이그레이션을 강행한다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['migration','data-integrity','database','testing']),

  ('EVT_TEST_014', 'test', 3, 'API 계약 테스트 실패',
   '마이크로서비스 간 API 계약 테스트에서 공급자와 소비자 간 불일치가 여럿 발견됐다.',
   '[
     {"label": "계약 우선 개발로 전환", "description": "Pact 등으로 계약 우선 개발 방식을 도입하고 불일치를 수정한다.", "time_delta": 4, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "API 버전 관리 도입", "description": "API 버전 관리를 도입해 하위 호환성을 보장한다.", "required_command": "version", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "소비자가 맞추기", "description": "소비자 서비스가 공급자 API에 맞게 수정하도록 한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 3, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['contract-testing','microservices','api','integration']),

  ('EVT_TEST_015', 'test', 2, '회귀 테스트 범위 부족',
   '신규 기능 추가 후 기존 기능이 예상치 못하게 깨지는 회귀 버그가 반복되고 있다.',
   '[
     {"label": "회귀 스위트 구축", "description": "핵심 사용자 시나리오를 커버하는 회귀 테스트 스위트를 구축한다.", "time_delta": 4, "risk_delta": -2, "debt_delta": -1, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "변경 영향 분석 도구 도입", "description": "코드 변경 시 영향받는 테스트를 자동으로 선택하는 도구를 도입한다.", "required_command": "analyze", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "QA 수동 체크", "description": "릴리즈 전 QA가 수동으로 핵심 기능을 체크하게 한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['regression','testing','quality','automation']),

  ('EVT_TEST_016', 'test', 5, '프로덕션 유사 데이터로 테스트 시 개인정보 노출',
   '스테이징 환경에 실제 사용자 데이터가 마스킹 없이 복사된 것이 발견됐다.',
   '[
     {"label": "즉시 데이터 삭제 및 마스킹", "description": "스테이징의 실제 데이터를 즉시 삭제하고 마스킹 정책을 수립한다.", "time_delta": 3, "risk_delta": -5, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "데이터 합성 파이프라인 구축", "description": "실제 데이터 패턴을 유지하는 합성 데이터 생성 파이프라인을 구축한다.", "required_command": "secure", "time_delta": 4, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "접근 제한만 강화", "description": "스테이징 환경 접근을 제한하고 데이터는 그대로 유지한다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['privacy','gdpr','data','security']),

-- ============================================================
-- DEPLOY PHASE (16개)
-- ============================================================
  ('EVT_DEPL_001', 'deploy', 4, '환경 변수 설정 오류',
   '프로덕션 배포 후 서비스가 시작되지 않는다. 확인해보니 필수 환경 변수가 누락되어 있다.',
   '[
     {"label": "환경 변수 체크리스트 적용", "description": "배포 전 필수 환경 변수 체크리스트를 도입하고 즉시 수정 배포한다.", "time_delta": 2, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "환경 변수 검증 자동화", "description": "앱 시작 시 필수 환경 변수를 자동 검증하는 로직을 추가한다.", "required_command": "validate", "time_delta": 3, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "기본값으로 강행", "description": "누락된 환경 변수에 임시 기본값을 넣고 서비스를 시작한다.", "time_delta": -2, "risk_delta": 5, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['deploy','configuration','environment','incident']),

  ('EVT_DEPL_002', 'deploy', 5, '롤백 판단 기로',
   '프로덕션 배포 후 에러율이 5%에서 15%로 치솟았다. 원인 파악 전 롤백 여부를 결정해야 한다.',
   '[
     {"label": "즉시 롤백", "description": "에러율 임계치 초과로 즉시 이전 버전으로 롤백한다.", "time_delta": 1, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "원인 분석 후 판단", "description": "10분간 로그를 분석해 원인을 파악한 뒤 롤백 여부를 결정한다.", "required_command": "analyze", "time_delta": 2, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2},
     {"label": "계속 유지하며 핫픽스", "description": "서비스를 유지하면서 긴급 핫픽스를 준비한다.", "time_delta": -3, "risk_delta": 5, "debt_delta": 2, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['rollback','deploy','incident','error-rate']),

  ('EVT_DEPL_003', 'deploy', 3, '카나리 배포 이상 징후',
   '카나리 배포 중 5% 트래픽을 받은 신규 버전에서 응답 시간이 200ms에서 800ms로 증가했다.',
   '[
     {"label": "카나리 중단 및 분석", "description": "카나리 배포를 중단하고 성능 저하 원인을 분석한다.", "time_delta": 2, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "프로파일링 후 최적화", "description": "카나리 환경에서 프로파일링을 실시해 병목을 찾고 수정한다.", "required_command": "profile", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "전체 배포 강행", "description": "일시적 현상이라 판단하고 전체 트래픽으로 배포를 완료한다.", "time_delta": -3, "risk_delta": 5, "debt_delta": 2, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['canary','deploy','performance','monitoring']),

  ('EVT_DEPL_004', 'deploy', 5, 'DB 마이그레이션 실패',
   '프로덕션 DB 마이그레이션 도중 실패했다. 일부 테이블은 변경되고 일부는 변경 전 상태다.',
   '[
     {"label": "마이그레이션 롤백", "description": "트랜잭션 롤백 스크립트를 실행해 DB를 이전 상태로 복구한다.", "time_delta": 3, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "DBA 긴급 투입", "description": "DBA를 긴급 투입해 DB 상태를 진단하고 수동으로 복구한다.", "required_command": "escalate", "time_delta": 2, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "마이그레이션 재시도", "description": "실패 원인 파악 없이 마이그레이션을 다시 실행한다.", "time_delta": -2, "risk_delta": 6, "debt_delta": 3, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['migration','database','deploy','incident']),

  ('EVT_DEPL_005', 'deploy', 3, '인프라 프로비저닝 오류',
   'Terraform apply 중 리소스 생성이 실패했다. 일부 서버만 생성된 불완전한 상태다.',
   '[
     {"label": "Terraform destroy 후 재적용", "description": "불완전한 리소스를 destroy하고 처음부터 다시 apply한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "상태 파일 수동 수정", "description": "terraform.tfstate를 수동으로 수정해 실제 상태와 동기화한다.", "required_command": "fix", "time_delta": 2, "risk_delta": -2, "debt_delta": 1, "quality_delta": 1},
     {"label": "수동 인프라 구성", "description": "실패한 리소스를 콘솔에서 수동으로 생성해 맞춘다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 4, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['terraform','infrastructure','iac','deploy']),

  ('EVT_DEPL_006', 'deploy', 4, 'SSL 인증서 만료',
   '프로덕션 SSL 인증서가 만료되어 사용자가 보안 경고를 보고 서비스에 접근하지 못하고 있다.',
   '[
     {"label": "인증서 즉시 갱신", "description": "Let''s Encrypt 또는 CA에서 인증서를 즉시 갱신하고 배포한다.", "time_delta": 1, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "자동 갱신 설정", "description": "인증서를 갱신하고 certbot으로 자동 갱신 체계를 구축한다.", "required_command": "automate", "time_delta": 2, "risk_delta": -4, "debt_delta": -2, "quality_delta": 3},
     {"label": "임시 HTTP 운영", "description": "인증서 갱신 중 HTTP로 임시 서비스를 운영한다.", "time_delta": -2, "risk_delta": 5, "debt_delta": 2, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['ssl','certificate','security','incident']),

  ('EVT_DEPL_007', 'deploy', 3, '컨테이너 이미지 취약점 발견',
   'Harbor 레지스트리 스캔에서 배포 직전 컨테이너 이미지에 HIGH 등급 취약점이 발견됐다.',
   '[
     {"label": "베이스 이미지 교체", "description": "취약점 없는 최신 베이스 이미지로 교체하고 재빌드한다.", "time_delta": 2, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "이미지 스캔 파이프라인 추가", "description": "CI 파이프라인에 컨테이너 취약점 스캔을 추가해 재발을 방지한다.", "required_command": "secure", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "취약점 무시하고 배포", "description": "운영 중 익스플로잇 가능성이 낮다고 판단해 그냥 배포한다.", "time_delta": -2, "risk_delta": 5, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['container','security','vulnerability','deploy']),

  ('EVT_DEPL_008', 'deploy', 2, 'DNS 전파 지연',
   '새 도메인으로 트래픽을 전환했지만 DNS 전파가 지연되어 일부 지역 사용자가 접근하지 못하고 있다.',
   '[
     {"label": "TTL 단축 후 재전파", "description": "DNS TTL을 60초로 줄이고 사전 공지로 사용자에게 안내한다.", "time_delta": 1, "risk_delta": -1, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "GeoDNS 설정 최적화", "description": "지역별 DNS 전파 상태를 모니터링하고 Anycast로 전환한다.", "required_command": "configure", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2},
     {"label": "기다리기", "description": "24시간 후 전파 완료될 것을 기대하며 대기한다.", "time_delta": 0, "risk_delta": 2, "debt_delta": 0, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['dns','network','deploy','propagation']),

  ('EVT_DEPL_009', 'deploy', 4, '블루-그린 배포 실패',
   '블루-그린 배포에서 그린 환경으로 트래픽을 전환하자 헬스체크가 실패해 자동 롤백이 트리거됐다.',
   '[
     {"label": "헬스체크 원인 분석", "description": "헬스체크 실패 원인을 분석하고 그린 환경 문제를 수정한다.", "time_delta": 3, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "헬스체크 기준 재설계", "description": "헬스체크 엔드포인트와 판단 기준을 재설계해 오탐을 줄인다.", "required_command": "design", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "헬스체크 비활성화", "description": "헬스체크를 끄고 수동으로 배포 상태를 확인한다.", "time_delta": -2, "risk_delta": 5, "debt_delta": 3, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['blue-green','deploy','healthcheck','incident']),

  ('EVT_DEPL_010', 'deploy', 3, 'Kubernetes 파드 크래시루프',
   '새 버전 배포 후 K8s 파드가 CrashLoopBackOff 상태에 빠졌다.',
   '[
     {"label": "이전 이미지로 롤백", "description": "kubectl rollout undo로 이전 버전으로 즉시 롤백한다.", "time_delta": 1, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "로그 분석 후 수정", "description": "파드 로그와 이벤트를 분석해 크래시 원인을 파악하고 수정한다.", "required_command": "debug", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "리소스 제한 완화", "description": "OOM일 것이라 추정하고 메모리 제한을 2배로 늘린다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['kubernetes','crashloop','deploy','container']),

  ('EVT_DEPL_011', 'deploy', 2, '배포 알림 누락',
   '프로덕션 배포가 완료됐지만 팀과 이해관계자에게 알림이 전송되지 않아 혼란이 발생했다.',
   '[
     {"label": "배포 알림 자동화", "description": "CI/CD 파이프라인에 Slack 배포 알림을 자동으로 추가한다.", "time_delta": 1, "risk_delta": -1, "debt_delta": -1, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "배포 채널 운영", "description": "배포 전용 채널을 만들고 릴리즈 노트 배포 SOP를 수립한다.", "required_command": "communicate", "time_delta": 2, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "사후 공지로 해결", "description": "배포 완료 후 수동으로 관련자에게 이메일을 보낸다.", "time_delta": -1, "risk_delta": 1, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['deploy','communication','notification','process']),

  ('EVT_DEPL_012', 'deploy', 4, '프로덕션 시크릿 노출',
   '배포 로그에 데이터베이스 비밀번호가 평문으로 출력된 것이 발견됐다.',
   '[
     {"label": "즉시 시크릿 교체", "description": "노출된 시크릿을 즉시 교체하고 Vault 등 시크릿 관리 도구를 도입한다.", "time_delta": 3, "risk_delta": -5, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "접근 로그 감사", "description": "시크릿이 노출된 기간 동안의 접근 로그를 전수 감사한다.", "required_command": "audit", "time_delta": 4, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "로그 삭제 후 조용히 처리", "description": "해당 로그만 삭제하고 내부적으로만 시크릿을 교체한다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['security','secret','credential','incident']),

  ('EVT_DEPL_013', 'deploy', 3, '배포 후 메모리 사용량 급증',
   '신규 버전 배포 후 서버 메모리 사용량이 이전 버전 대비 40% 증가했다.',
   '[
     {"label": "메모리 프로파일링", "description": "신규 버전의 메모리 사용 패턴을 프로파일링하고 원인을 분석한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "오토스케일링 임시 조정", "description": "메모리 임계치를 조정하고 오토스케일링으로 임시 대응한다.", "required_command": "scale", "time_delta": 1, "risk_delta": -2, "debt_delta": 1, "quality_delta": 1},
     {"label": "롤백", "description": "원인 파악 없이 즉시 이전 버전으로 롤백한다.", "time_delta": -2, "risk_delta": 2, "debt_delta": 0, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['memory','deploy','performance','monitoring']),

  ('EVT_DEPL_014', 'deploy', 5, '제로 다운타임 배포 실패',
   '제로 다운타임을 목표로 했지만 배포 중 30초간 서비스가 중단됐다. SLA 위반이다.',
   '[
     {"label": "배포 전략 재설계", "description": "롤링 업데이트 설정을 재검토하고 graceful shutdown을 구현한다.", "time_delta": 5, "risk_delta": -3, "debt_delta": 0, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "고객 SLA 보상 처리", "description": "SLA 위반에 따른 보상 처리와 재발 방지책을 수립한다.", "required_command": "escalate", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2},
     {"label": "SLA 기준 완화 요청", "description": "SLA 기준이 너무 엄격하다고 주장하고 기준 완화를 요청한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 1, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['zero-downtime','sla','deploy','availability']),

  ('EVT_DEPL_015', 'deploy', 3, 'CDN 캐시 무효화 실패',
   '새 버전 배포 후 CDN에 이전 버전 파일이 캐시되어 사용자에게 구버전이 노출되고 있다.',
   '[
     {"label": "CDN 캐시 강제 퍼지", "description": "CDN 전체 캐시를 강제 퍼지하고 재배포한다.", "time_delta": 1, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "캐시 무효화 자동화", "description": "배포 파이프라인에 CDN 캐시 자동 무효화를 추가한다.", "required_command": "automate", "time_delta": 2, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "사용자 강제 새로고침 안내", "description": "사용자에게 Ctrl+Shift+R로 강제 새로고침을 안내한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['cdn','cache','deploy','frontend']),

  ('EVT_DEPL_016', 'deploy', 4, '데이터베이스 커넥션 풀 고갈',
   '배포 후 트래픽이 몰리며 DB 커넥션 풀이 고갈되어 신규 요청이 타임아웃되고 있다.',
   '[
     {"label": "커넥션 풀 사이즈 조정", "description": "즉시 커넥션 풀 사이즈를 늘리고 적정 값을 계산한다.", "time_delta": 1, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "PgBouncer 도입", "description": "커넥션 풀러 PgBouncer를 도입해 커넥션을 효율적으로 관리한다.", "required_command": "optimize", "time_delta": 3, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "트래픽 차단", "description": "DB 안정화를 위해 일시적으로 신규 트래픽을 차단한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 1, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['database','connection-pool','deploy','performance']),

-- ============================================================
-- OPERATE PHASE (16개)
-- ============================================================
  ('EVT_OPER_001', 'operate', 5, '트래픽 스파이크 — 서버 과부하',
   '마케팅 이벤트로 평소 대비 10배 트래픽이 몰리며 서버 CPU가 95%를 넘었다.',
   '[
     {"label": "오토스케일링 즉시 확장", "description": "오토스케일링 그룹을 수동으로 즉시 확장해 부하를 분산한다.", "time_delta": 1, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "트래픽 쉐이핑 적용", "description": "Rate Limiting과 큐잉으로 트래픽을 제어하며 점진적으로 수용한다.", "required_command": "scale", "time_delta": 2, "risk_delta": -4, "debt_delta": -1, "quality_delta": 3},
     {"label": "일부 기능 비활성화", "description": "무거운 기능을 비활성화하고 핵심 기능만 유지하며 버틴다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['traffic','scaling','incident','performance']),

  ('EVT_OPER_002', 'operate', 5, '결제 에러 급증',
   '새벽 3시 결제 실패율이 갑자기 30%로 치솟았다. PG사 측과 원인이 불분명한 상황이다.',
   '[
     {"label": "PG사 긴급 연락", "description": "PG사 긴급 채널로 연락해 현황을 공유하고 협력해 원인을 파악한다.", "time_delta": 2, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "결제 백업 수단 활성화", "description": "백업 PG사로 트래픽을 전환해 결제를 복구한다.", "required_command": "failover", "time_delta": 1, "risk_delta": -4, "debt_delta": 1, "quality_delta": 2},
     {"label": "결제 기능 임시 중단", "description": "결제 기능을 임시 중단하고 사용자에게 공지한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 0, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['payment','incident','error-rate','critical']),

  ('EVT_OPER_003', 'operate', 2, '알람 피로 — 경보 무감각',
   '알람이 너무 많이 울려 팀이 무감각해졌다. 진짜 장애 알람도 무시되는 상황이다.',
   '[
     {"label": "알람 정책 재설계", "description": "노이즈성 알람을 제거하고 actionable 알람만 남기는 정책을 수립한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2, "bonus_event_chance": 0.15},
     {"label": "알람 계층화", "description": "알람을 INFO/WARNING/CRITICAL로 계층화하고 채널을 분리한다.", "required_command": "configure", "time_delta": 2, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "알람 임계치 높이기", "description": "알람 임계치를 높여 발생 횟수를 줄인다.", "time_delta": -1, "risk_delta": 4, "debt_delta": 1, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['monitoring','alert','fatigue','operations']),

  ('EVT_OPER_004', 'operate', 4, '클라우드 비용 폭증',
   '이번 달 AWS 비용이 전월 대비 300% 증가했다. 예산을 크게 초과한 상태다.',
   '[
     {"label": "비용 분석 및 최적화", "description": "Cost Explorer로 비용 급증 원인을 파악하고 즉시 최적화한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "FinOps 프로세스 도입", "description": "FinOps 팀을 구성하고 클라우드 비용 거버넌스 프로세스를 수립한다.", "required_command": "optimize", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "예산 증액 요청", "description": "트래픽 증가에 따른 자연스러운 비용 증가라고 설명하고 예산 증액을 요청한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['cost','cloud','aws','finops']),

  ('EVT_OPER_005', 'operate', 4, '디스크 풀 — 서비스 중단',
   '로그 파일이 쌓여 프로덕션 서버 디스크가 100%에 달해 서비스가 쓰기 작업을 거부하고 있다.',
   '[
     {"label": "긴급 디스크 정리", "description": "불필요한 로그 파일을 즉시 삭제하고 서비스를 복구한다.", "time_delta": 1, "risk_delta": -3, "debt_delta": 0, "quality_delta": 1, "bonus_event_chance": 0.1},
     {"label": "로그 정책 수립", "description": "로그 로테이션 정책을 수립하고 중앙 로그 수집 시스템으로 이전한다.", "required_command": "configure", "time_delta": 3, "risk_delta": -4, "debt_delta": -2, "quality_delta": 3},
     {"label": "디스크 용량 늘리기", "description": "디스크 용량을 2배로 늘리고 동일 문제를 나중에 다시 겪는다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['disk','storage','incident','logging']),

  ('EVT_OPER_006', 'operate', 3, '서드파티 의존 서비스 장애',
   '사용 중인 SendGrid 이메일 서비스가 장애 중이다. 사용자 알림 메일이 발송되지 않고 있다.',
   '[
     {"label": "대체 이메일 서비스로 전환", "description": "AWS SES 등 백업 이메일 서비스로 즉시 전환한다.", "time_delta": 2, "risk_delta": -3, "debt_delta": 1, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "큐잉 후 복구 시 재전송", "description": "발송 실패 이메일을 큐에 쌓아두고 복구 후 재전송한다.", "required_command": "queue", "time_delta": 1, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2},
     {"label": "사용자에게 공지", "description": "이메일 서비스 장애를 공지하고 서비스 복구를 기다린다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 0, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['third-party','email','incident','dependency']),

  ('EVT_OPER_007', 'operate', 3, '대용량 데이터 쿼리로 인한 DB 과부하',
   '보고서 생성 쿼리가 프로덕션 DB를 점령해 일반 사용자 요청이 지연되고 있다.',
   '[
     {"label": "읽기 전용 복제본으로 분리", "description": "보고서 쿼리를 Read Replica로 분리해 프로덕션 DB 부하를 낮춘다.", "time_delta": 2, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "쿼리 스케줄링 적용", "description": "무거운 보고서 쿼리를 트래픽 적은 새벽 시간대로 스케줄링한다.", "required_command": "optimize", "time_delta": 1, "risk_delta": -3, "debt_delta": -1, "quality_delta": 2},
     {"label": "보고서 기능 일시 중단", "description": "DB 안정화를 위해 보고서 기능을 임시 중단한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 1, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['database','query','performance','reporting']),

  ('EVT_OPER_008', 'operate', 5, '보안 침해 감지',
   'SIEM에서 비정상적인 데이터 대량 조회 패턴이 감지됐다. 내부 또는 외부 공격 가능성이 있다.',
   '[
     {"label": "즉시 차단 및 포렌식", "description": "의심 IP와 계정을 즉시 차단하고 보안 포렌식을 시작한다.", "time_delta": 4, "risk_delta": -5, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "보안 팀 긴급 소집", "description": "보안 사고 대응 팀을 소집하고 CSIRT 프로세스를 가동한다.", "required_command": "escalate", "time_delta": 3, "risk_delta": -5, "debt_delta": -1, "quality_delta": 3},
     {"label": "모니터링 강화만", "description": "일단 지켜보면서 확실해지면 대응하기로 한다.", "time_delta": -2, "risk_delta": 6, "debt_delta": 2, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['security','incident','breach','siem']),

  ('EVT_OPER_009', 'operate', 3, 'API Rate Limit 초과',
   '특정 파트너사의 API 호출이 급증해 Rate Limit을 초과, 다른 고객까지 영향을 받고 있다.',
   '[
     {"label": "파트너사 제한 적용", "description": "해당 파트너사에 Rate Limit을 즉시 적용하고 개선을 요청한다.", "time_delta": 1, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "고객별 Rate Limit 정책 수립", "description": "모든 고객에게 공정한 Rate Limit 정책을 수립하고 적용한다.", "required_command": "configure", "time_delta": 3, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "인프라 스케일 업", "description": "Rate Limit을 올리고 인프라를 확장해 감당한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 2, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['api','rate-limit','partner','operations']),

  ('EVT_OPER_010', 'operate', 4, 'On-call 번아웃',
   'On-call 팀원들이 새벽 알람으로 탈진 상태다. 이직 의사를 밝히는 팀원이 늘고 있다.',
   '[
     {"label": "On-call 로테이션 개선", "description": "On-call 주기를 줄이고 보상 체계를 마련한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.15},
     {"label": "알람 자동화로 부하 감소", "description": "반복성 장애를 자동 복구하는 Runbook 자동화를 도입한다.", "required_command": "automate", "time_delta": 4, "risk_delta": -4, "debt_delta": -2, "quality_delta": 3},
     {"label": "강행군 독려", "description": "조직의 성장 단계이므로 조금만 버텨달라고 팀에게 호소한다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 2, "quality_delta": -3}
   ]'::jsonb,
   ARRAY['on-call','burnout','operations','team']),

  ('EVT_OPER_011', 'operate', 3, '로그 없는 장애 원인 파악 불가',
   '5분간 장애가 발생했지만 로그가 부족해 원인을 전혀 파악할 수 없는 상황이다.',
   '[
     {"label": "구조화 로깅 도입", "description": "JSON 구조화 로깅을 전면 도입하고 로그 레벨 정책을 수립한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "분산 트레이싱 구축", "description": "OpenTelemetry로 분산 트레이싱을 구축해 재발 시 원인을 추적한다.", "required_command": "trace", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "팀 경험에 의존", "description": "로그 없이 경험으로 원인을 추측하고 대응한다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['logging','observability','debugging','incident']),

  ('EVT_OPER_012', 'operate', 2, 'SLO 위반 임박',
   '이번 달 가용성 SLO 99.9%를 달성하기 위한 에러 예산이 거의 소진됐다.',
   '[
     {"label": "에러 예산 정책 적용", "description": "에러 예산 소진 시 배포를 중단하고 안정화에 집중하는 정책을 적용한다.", "time_delta": 2, "risk_delta": -2, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "SLO 대시보드 공유", "description": "실시간 SLO 대시보드를 팀 전체와 공유해 경각심을 높인다.", "required_command": "monitor", "time_delta": 1, "risk_delta": -2, "debt_delta": -1, "quality_delta": 2},
     {"label": "SLO 재협상", "description": "현실적으로 달성 불가한 SLO라고 주장하며 재협상을 시도한다.", "time_delta": -1, "risk_delta": 2, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['slo','sla','reliability','operations']),

  ('EVT_OPER_013', 'operate', 4, '핵심 데이터 삭제 사고',
   '운영자 실수로 프로덕션 DB에서 중요 테이블의 레코드 수천 건이 삭제됐다.',
   '[
     {"label": "백업에서 즉시 복구", "description": "가장 최근 백업에서 삭제된 데이터를 복구한다.", "time_delta": 3, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "Point-in-time 복구", "description": "DB의 PITR 기능으로 삭제 직전 시점으로 복구한다.", "required_command": "restore", "time_delta": 2, "risk_delta": -5, "debt_delta": -1, "quality_delta": 3},
     {"label": "소프트 삭제 구현 후 처리", "description": "향후 재발 방지를 위해 소프트 삭제 패턴을 도입한다.", "time_delta": -2, "risk_delta": 3, "debt_delta": 2, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['data','incident','backup','recovery']),

  ('EVT_OPER_014', 'operate', 3, '오픈소스 라이선스 위반 발견',
   '법무팀 감사에서 사용 중인 오픈소스 라이브러리의 라이선스(AGPL)가 상용 제품에 사용 불가임이 밝혀졌다.',
   '[
     {"label": "라이선스 호환 대체재 교체", "description": "AGPL 라이브러리를 MIT/Apache 라이선스 대체재로 교체한다.", "time_delta": 4, "risk_delta": -3, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "전체 의존성 라이선스 감사", "description": "모든 의존성의 라이선스를 전수 감사하고 화이트리스트를 만든다.", "required_command": "audit", "time_delta": 5, "risk_delta": -4, "debt_delta": -1, "quality_delta": 2},
     {"label": "법무팀에 해석 재요청", "description": "AGPL 해석에 이의를 제기하며 법무팀에 재검토를 요청한다.", "time_delta": -2, "risk_delta": 4, "debt_delta": 1, "quality_delta": -1}
   ]'::jsonb,
   ARRAY['license','legal','compliance','open-source']),

  ('EVT_OPER_015', 'operate', 4, 'DDoS 공격',
   '봇 트래픽으로 의심되는 대규모 요청이 서비스에 유입되어 정상 사용자가 접근하지 못하고 있다.',
   '[
     {"label": "CDN WAF 활성화", "description": "Cloudflare WAF/Rate Limiting을 즉시 활성화해 봇 트래픽을 차단한다.", "time_delta": 1, "risk_delta": -4, "debt_delta": 0, "quality_delta": 2, "bonus_event_chance": 0.1},
     {"label": "IP 블랙리스트 적용", "description": "공격 IP 대역을 분석해 블랙리스트에 추가하고 지속 모니터링한다.", "required_command": "block", "time_delta": 2, "risk_delta": -4, "debt_delta": -1, "quality_delta": 2},
     {"label": "관망", "description": "공격이 곧 멈출 것이라 기대하며 대기한다.", "time_delta": -3, "risk_delta": 5, "debt_delta": 1, "quality_delta": -4}
   ]'::jsonb,
   ARRAY['ddos','security','incident','network']),

  ('EVT_OPER_016', 'operate', 3, '모니터링 사각지대 발견',
   '장애 대응 중 핵심 비즈니스 메트릭(주문 완료율 등)이 전혀 모니터링되지 않고 있음을 발견했다.',
   '[
     {"label": "비즈니스 메트릭 대시보드 구축", "description": "핵심 비즈니스 KPI를 실시간으로 모니터링하는 대시보드를 구축한다.", "time_delta": 3, "risk_delta": -2, "debt_delta": -1, "quality_delta": 3, "bonus_event_chance": 0.1},
     {"label": "골든 시그널 도입", "description": "Latency, Traffic, Error, Saturation 골든 시그널로 모니터링을 체계화한다.", "required_command": "monitor", "time_delta": 4, "risk_delta": -3, "debt_delta": -1, "quality_delta": 3},
     {"label": "기술 메트릭만 유지", "description": "서버 CPU/메모리 등 인프라 메트릭만으로 충분하다고 판단한다.", "time_delta": -1, "risk_delta": 3, "debt_delta": 1, "quality_delta": -2}
   ]'::jsonb,
   ARRAY['monitoring','observability','business-metrics','operations'])

ON CONFLICT (event_key) DO UPDATE SET
  severity = EXCLUDED.severity,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  choices = EXCLUDED.choices,
  tags = EXCLUDED.tags,
  version = public.events.version + 1;
