-- ============================================================
-- 001_tickets.sql: STACKWORLD 티켓 seed 데이터 (120개)
-- phase별 24개씩 (plan, implement, test, deploy, operate)
-- 각 phase 내 position_tag 균등 분배: FE(6), BE(6), INFRA(6), QA(6)
-- ============================================================

INSERT INTO public.tickets (ticket_key, phase, position_tag, title, description, base_time_cost, base_risk_delta, base_quality_delta, reward_xp, reward_items)
VALUES

-- ============================================================
-- PHASE: PLAN
-- ============================================================

-- PLAN / FE (6개)
  ('PLAN_FE_001', 'plan', 'FE', 'UX 와이어프레임 초안 작성',
   '주요 사용자 플로우(회원가입, 대시보드, 런 진행)에 대한 와이어프레임을 Figma로 작성한다. 모바일/데스크톱 반응형 레이아웃을 모두 포함한다.',
   2, -1, 2,
   '{"position":{"FE":40},"core":{"design":15}}',
   '{"credits":80,"materials":{"plan_scroll":1}}'),

  ('PLAN_FE_002', 'plan', 'FE', '컴포넌트 디자인 시스템 스코프 정의',
   '공통 UI 컴포넌트(Button, Modal, Card, Badge 등)의 범위와 토큰 체계(색상, 타이포, 간격)를 정의한다. Storybook 연동 계획을 포함한다.',
   2, 0, 2,
   '{"position":{"FE":35},"core":{"design":20}}',
   '{"credits":70,"materials":{"plan_scroll":1}}'),

  ('PLAN_FE_003', 'plan', 'FE', '페이지 라우팅 구조 설계',
   'Next.js App Router 기반의 전체 페이지 트리를 설계한다. 인증 보호 라우트, 공개 라우트, 레이아웃 계층을 명세한다.',
   1, 0, 1,
   '{"position":{"FE":30},"core":{"design":10}}',
   '{"credits":60}'),

  ('PLAN_FE_004', 'plan', 'FE', '상태 관리 전략 수립',
   '전역 상태(런 진행 상황, 유저 정보)와 서버 상태(Supabase 데이터) 관리 방식을 결정한다. Zustand vs Jotai 비교 분석을 포함한다.',
   2, 1, 1,
   '{"position":{"FE":35},"core":{"problem_solving":15}}',
   '{"credits":70,"materials":{"plan_scroll":1}}'),

  ('PLAN_FE_005', 'plan', 'FE', '애니메이션 및 전환 효과 사양서 작성',
   '런 진행 중 페이즈 전환, 티켓 선택, 이벤트 팝업 등의 애니메이션 스펙을 정의한다. Framer Motion 적용 여부와 성능 목표를 명시한다.',
   1, 0, 2,
   '{"position":{"FE":25},"core":{"design":10}}',
   '{"credits":50}'),

  ('PLAN_FE_006', 'plan', 'FE', '접근성(A11y) 요구사항 정의',
   'WCAG 2.1 AA 기준에 맞는 접근성 요구사항을 문서화한다. 키보드 네비게이션, 스크린 리더 지원, 색 대비 기준을 포함한다.',
   1, -1, 3,
   '{"position":{"FE":20},"core":{"design":15,"delivery":5}}',
   '{"credits":50,"materials":{"plan_scroll":1}}'),

-- PLAN / BE (6개)
  ('PLAN_BE_001', 'plan', 'BE', 'API 계약서 초안 작성 (OpenAPI)',
   'RESTful API 및 Supabase RPC 함수의 OpenAPI 3.0 명세를 작성한다. 요청/응답 스키마, 에러 코드, 인증 방식을 정의한다.',
   3, -1, 2,
   '{"position":{"BE":50},"core":{"design":20}}',
   '{"credits":100,"materials":{"plan_scroll":2}}'),

  ('PLAN_BE_002', 'plan', 'BE', '데이터 모델 초안 설계',
   '핵심 엔티티(character, run, ticket, raid)의 ER 다이어그램을 작성하고 정규화 수준, 인덱스 전략, JSONB 필드 활용 범위를 결정한다.',
   3, 0, 2,
   '{"position":{"BE":50},"core":{"design":20,"problem_solving":10}}',
   '{"credits":100,"materials":{"plan_scroll":2}}'),

  ('PLAN_BE_003', 'plan', 'BE', '런 게임루프 로직 명세',
   '런 시작, 페이즈 전환, 티켓 선택, 이벤트 발생, 런 종료의 상태 머신을 명세한다. 서버사이드 검증 범위와 클라이언트 낙관적 업데이트 전략을 포함한다.',
   3, 1, 1,
   '{"position":{"BE":45},"core":{"problem_solving":20}}',
   '{"credits":90,"materials":{"plan_scroll":2,"circuit_board":1}}'),

  ('PLAN_BE_004', 'plan', 'BE', '인증/인가 정책 수립',
   'Supabase Auth를 사용한 소셜 로그인(Google, GitHub) 플로우를 설계한다. RLS 정책 원칙과 JWT 클레임 활용 방식을 문서화한다.',
   2, -1, 2,
   '{"position":{"BE":40},"core":{"design":15,"delivery":5}}',
   '{"credits":80}'),

  ('PLAN_BE_005', 'plan', 'BE', '리스크 레지스터 작성',
   '기술 부채, 서드파티 의존성, 데이터 정합성 위험 요소를 식별하고 완화 전략을 문서화한다. 우선순위 매트릭스(영향도 x 발생확률)를 포함한다.',
   2, -2, 1,
   '{"position":{"BE":35},"core":{"problem_solving":15,"delivery":10}}',
   '{"credits":70,"materials":{"plan_scroll":1}}'),

  ('PLAN_BE_006', 'plan', 'BE', '이벤트 소싱 패턴 적용 범위 결정',
   'run_commands 테이블 기반 이벤트 소싱의 장단점을 분석하고 재현(replay) 가능성 보장 방법과 스냅샷 전략을 결정한다.',
   2, 1, 2,
   '{"position":{"BE":40},"core":{"problem_solving":20,"design":10}}',
   '{"credits":80,"materials":{"plan_scroll":1,"circuit_board":1}}'),

-- PLAN / INFRA (6개)
  ('PLAN_INFRA_001', 'plan', 'INFRA', 'Supabase 프로젝트 환경 분리 계획',
   'dev / staging / production 환경별 Supabase 프로젝트 분리 전략을 수립한다. 환경 변수 관리, 시크릿 보관(GitHub Actions Secrets) 방법을 포함한다.',
   2, -1, 2,
   '{"position":{"INFRA":40},"core":{"delivery":15}}',
   '{"credits":80,"materials":{"plan_scroll":1,"infra_node":1}}'),

  ('PLAN_INFRA_002', 'plan', 'INFRA', 'CI/CD 파이프라인 설계',
   'GitHub Actions 기반 CI(lint, type-check, test) 및 CD(Vercel 배포, Supabase 마이그레이션) 파이프라인을 설계한다.',
   2, 0, 2,
   '{"position":{"INFRA":45},"core":{"delivery":20}}',
   '{"credits":90,"materials":{"plan_scroll":1,"infra_node":1}}'),

  ('PLAN_INFRA_003', 'plan', 'INFRA', '모니터링 & 알림 전략 수립',
   '에러 추적(Sentry), 성능 모니터링(Vercel Analytics), DB 쿼리 모니터링의 도구 선택과 알림 임계값을 정의한다.',
   2, -1, 2,
   '{"position":{"INFRA":40},"core":{"delivery":10,"problem_solving":10}}',
   '{"credits":80,"materials":{"plan_scroll":1}}'),

  ('PLAN_INFRA_004', 'plan', 'INFRA', '보안 정책 체크리스트 작성',
   'OWASP Top 10 기준 체크리스트를 작성하고 Supabase RLS, API Rate Limiting, CORS 설정 기준을 문서화한다.',
   2, -2, 3,
   '{"position":{"INFRA":35},"core":{"delivery":10,"design":10}}',
   '{"credits":70,"materials":{"plan_scroll":1,"infra_node":1}}'),

  ('PLAN_INFRA_005', 'plan', 'INFRA', '인프라 비용 추정 및 최적화 계획',
   'Vercel, Supabase 무료/유료 플랜 한계를 파악하고 초기 사용자 규모별 예상 비용과 스케일아웃 시점을 계획한다.',
   1, 0, 1,
   '{"position":{"INFRA":30},"core":{"delivery":15}}',
   '{"credits":60}'),

  ('PLAN_INFRA_006', 'plan', 'INFRA', '백업 및 재해복구(DR) 계획 수립',
   'Supabase DB 백업 주기, 포인트인타임 복구 설정, RPO/RTO 목표치를 정의하고 복구 시나리오를 문서화한다.',
   2, -2, 3,
   '{"position":{"INFRA":35},"core":{"delivery":20}}',
   '{"credits":70,"materials":{"plan_scroll":2,"infra_node":1}}'),

-- PLAN / QA (6개)
  ('PLAN_QA_001', 'plan', 'QA', '테스트 전략 문서 작성',
   '단위/통합/E2E 테스트의 범위와 책임을 정의한다. 테스트 커버리지 목표(라인 80%), 사용 도구(Vitest, Playwright), 실행 환경을 명세한다.',
   2, -1, 2,
   '{"position":{"QA":40},"core":{"delivery":15,"design":10}}',
   '{"credits":80,"materials":{"plan_scroll":1,"test_crystal":1}}'),

  ('PLAN_QA_002', 'plan', 'QA', '품질 게이트 기준 정의',
   'PR 머지 조건(CI 통과, 리뷰어 2명 승인, 커버리지 미달 없음)과 릴리즈 품질 게이트(성능 예산, 에러율)를 문서화한다.',
   1, -1, 3,
   '{"position":{"QA":30},"core":{"delivery":15}}',
   '{"credits":60,"materials":{"plan_scroll":1}}'),

  ('PLAN_QA_003', 'plan', 'QA', '테스트 환경 및 데이터 관리 계획',
   '테스트용 seed 데이터 전략, 테스트 DB 초기화 방법, 환경별 목(mock) 서버 운영 계획을 수립한다.',
   2, 0, 2,
   '{"position":{"QA":35},"core":{"delivery":10,"problem_solving":10}}',
   '{"credits":70,"materials":{"test_crystal":1}}'),

  ('PLAN_QA_004', 'plan', 'QA', '탐색적 테스트 계획 수립',
   '게임 핵심 플로우(런 진행, 레이드, PvP)에 대한 탐색적 테스트 세션 계획을 작성한다. 버그 리포팅 템플릿과 심각도 분류 기준을 정의한다.',
   1, 0, 2,
   '{"position":{"QA":25},"core":{"design":10,"problem_solving":5}}',
   '{"credits":50,"materials":{"test_crystal":1}}'),

  ('PLAN_QA_005', 'plan', 'QA', '성능 테스트 기준선 설정',
   '핵심 API 응답시간 목표(p95 < 200ms), 동시접속 사용자 수 목표, Lighthouse 점수 기준(Performance 90+)을 설정한다.',
   2, 0, 2,
   '{"position":{"QA":35},"core":{"delivery":15,"problem_solving":5}}',
   '{"credits":70,"materials":{"plan_scroll":1,"test_crystal":1}}'),

  ('PLAN_QA_006', 'plan', 'QA', '보안 테스트 항목 체크리스트 작성',
   'RLS 우회 시도, JWT 변조, SQL Injection, XSS 등 게임 API에 특화된 보안 테스트 케이스를 작성한다.',
   2, -2, 3,
   '{"position":{"QA":35},"core":{"problem_solving":15,"delivery":10}}',
   '{"credits":70,"materials":{"plan_scroll":1,"test_crystal":2}}'),

-- ============================================================
-- PHASE: IMPLEMENT
-- ============================================================

-- IMPLEMENT / FE (6개)
  ('IMPL_FE_001', 'implement', 'FE', '런 대시보드 UI 구현',
   '현재 런의 time, risk, quality, debt 지표를 실시간으로 표시하는 대시보드 컴포넌트를 구현한다. 각 지표의 색상 임계값(위험/경고/정상)을 시각화한다.',
   3, 1, 2,
   '{"position":{"FE":60},"core":{"design":15,"delivery":10}}',
   '{"credits":120,"materials":{"circuit_board":1}}'),

  ('IMPL_FE_002', 'implement', 'FE', '티켓 선택 인터랙션 구현',
   '3장 티켓 드로우 후 카드 선택 UI를 구현한다. 카드 호버 효과, 선택 애니메이션, 포지션별 색상 코딩, 툴팁(비용/위험/품질)을 포함한다.',
   3, 1, 2,
   '{"position":{"FE":65},"core":{"design":20}}',
   '{"credits":130,"materials":{"circuit_board":2}}'),

  ('IMPL_FE_003', 'implement', 'FE', 'SSR 최적화 - 런 데이터 초기 로딩',
   'Next.js Server Component에서 런 초기 데이터를 Supabase SSR 클라이언트로 가져와 하이드레이션 비용을 최소화한다. Streaming 방식으로 Suspense 경계를 설정한다.',
   3, 1, 2,
   '{"position":{"FE":55},"core":{"problem_solving":20,"delivery":10}}',
   '{"credits":110,"materials":{"circuit_board":1}}'),

  ('IMPL_FE_004', 'implement', 'FE', '이벤트 팝업 모달 구현',
   '런 중 발생하는 이벤트 카드 모달을 구현한다. 이벤트 설명, 선택지 버튼, 선택 결과 피드백 애니메이션, 접근성(focus trap, ESC 닫기)을 포함한다.',
   2, 0, 2,
   '{"position":{"FE":50},"core":{"design":15}}',
   '{"credits":100}'),

  ('IMPL_FE_005', 'implement', 'FE', '인벤토리 & 아티팩트 UI 구현',
   '캐릭터 인벤토리 화면을 구현한다. 아티팩트 목록, 수량, 희귀도별 색상, 마켓 등록 버튼, 블루프린트 열람 기능을 포함한다.',
   3, 0, 1,
   '{"position":{"FE":55},"core":{"design":10,"delivery":10}}',
   '{"credits":110,"materials":{"circuit_board":1}}'),

  ('IMPL_FE_006', 'implement', 'FE', '실시간 레이드 HUD 구현',
   'Supabase Realtime 구독으로 레이드 KPI 변화를 실시간 반영하는 HUD를 구현한다. 낙관적 업데이트, 충돌 해결, 연결 끊김 재연결 처리를 포함한다.',
   4, 2, 2,
   '{"position":{"FE":80},"core":{"problem_solving":25,"delivery":10}}',
   '{"credits":160,"materials":{"circuit_board":2,"debug_token":1}}'),

-- IMPLEMENT / BE (6개)
  ('IMPL_BE_001', 'implement', 'BE', 'draw_ticket RPC 함수 구현',
   '런에서 티켓 3장을 드로우하는 Supabase RPC를 구현한다. 시드 기반 결정론적 드로우, 중복 방지, 페이즈 필터링, 포지션 가중치를 적용한다.',
   4, 2, 1,
   '{"position":{"BE":80},"core":{"problem_solving":25}}',
   '{"credits":160,"materials":{"circuit_board":2}}'),

  ('IMPL_BE_002', 'implement', 'BE', 'submit_command 멱등성 처리 구현',
   'idempotency_key 기반으로 동일 커맨드 중복 제출을 방지하는 로직을 구현한다. Redis 없이 DB 유니크 제약으로 처리하며 레이스 컨디션 시나리오를 검증한다.',
   3, 1, 2,
   '{"position":{"BE":65},"core":{"problem_solving":20,"delivery":10}}',
   '{"credits":130,"materials":{"circuit_board":1,"debug_token":1}}'),

  ('IMPL_BE_003', 'implement', 'BE', '레이드 액션 처리 서버 함수 구현',
   '레이드 참여자의 액션(mitigation, escalation, hotfix)을 처리하는 Edge Function을 구현한다. KPI 변화 계산, 이벤트 브로드캐스트, 타임아웃 처리를 포함한다.',
   4, 2, 1,
   '{"position":{"BE":85},"core":{"problem_solving":25,"delivery":10}}',
   '{"credits":170,"materials":{"circuit_board":2,"debug_token":1}}'),

  ('IMPL_BE_004', 'implement', 'BE', 'DB 쿼리 최적화 - 런 히스토리 조회',
   '캐릭터별 런 히스토리 조회 쿼리를 최적화한다. 복합 인덱스 추가, 페이지네이션(cursor 방식), 불필요한 컬럼 선택 제거로 p95 응답시간을 줄인다.',
   3, -1, 2,
   '{"position":{"BE":60},"core":{"problem_solving":20,"delivery":5}}',
   '{"credits":120,"materials":{"circuit_board":1}}'),

  ('IMPL_BE_005', 'implement', 'BE', 'WebSocket 실시간 레이드 채널 구현',
   'Supabase Realtime Broadcast 채널을 활용한 레이드 이벤트 구독/발행 구조를 구현한다. 참여자 입장/퇴장 추적, 채널 권한 검증을 포함한다.',
   4, 2, 1,
   '{"position":{"BE":75},"core":{"problem_solving":20,"delivery":10}}',
   '{"credits":150,"materials":{"circuit_board":2}}'),

  ('IMPL_BE_006', 'implement', 'BE', '대량 런 통계 집계 배치 함수 구현',
   '매일 자정 daily_character_stats를 집계하는 pg_cron 배치 함수를 구현한다. 부분 실패 재시도, cleanup_jobs 기록, 집계 누락 감지 알림을 포함한다.',
   3, 0, 2,
   '{"position":{"BE":60},"core":{"delivery":15,"problem_solving":10}}',
   '{"credits":120,"materials":{"circuit_board":1}}'),

-- IMPLEMENT / INFRA (6개)
  ('IMPL_INFRA_001', 'implement', 'INFRA', 'GitHub Actions CI 파이프라인 구현',
   'PR 단위로 실행되는 CI 워크플로우를 구현한다. 타입체크(tsc), 린트(ESLint), 단위테스트(Vitest), E2E(Playwright)를 병렬 실행하고 실패 시 Slack 알림을 보낸다.',
   3, -1, 2,
   '{"position":{"INFRA":60},"core":{"delivery":20}}',
   '{"credits":120,"materials":{"infra_node":2,"deploy_key":1}}'),

  ('IMPL_INFRA_002', 'implement', 'INFRA', 'Supabase 마이그레이션 자동화',
   'CD 파이프라인에 supabase db push 단계를 통합한다. 마이그레이션 실패 롤백, 환경별 분기 실행, 마이그레이션 이력 슬랙 보고를 구현한다.',
   3, 1, 1,
   '{"position":{"INFRA":65},"core":{"delivery":20,"problem_solving":5}}',
   '{"credits":130,"materials":{"infra_node":2,"deploy_key":1}}'),

  ('IMPL_INFRA_003', 'implement', 'INFRA', 'Sentry 에러 추적 연동',
   'Next.js 및 Supabase Edge Function에 Sentry SDK를 설치하고 소스맵 업로드, 릴리즈 태깅, 사용자 컨텍스트 주입을 설정한다.',
   2, -1, 2,
   '{"position":{"INFRA":45},"core":{"delivery":15}}',
   '{"credits":90,"materials":{"infra_node":1}}'),

  ('IMPL_INFRA_004', 'implement', 'INFRA', '환경 변수 및 시크릿 관리 체계 구축',
   'GitHub Actions Secrets, Vercel Environment Variables, Supabase Vault를 활용해 환경별 시크릿을 관리한다. 로컬 .env.local 생성 스크립트를 포함한다.',
   2, -1, 2,
   '{"position":{"INFRA":40},"core":{"delivery":15}}',
   '{"credits":80,"materials":{"infra_node":1}}'),

  ('IMPL_INFRA_005', 'implement', 'INFRA', 'CDN 캐싱 전략 적용',
   'Vercel Edge Network에서 정적 자산과 API 응답 캐싱 규칙을 설정한다. Cache-Control 헤더, ISR(Incremental Static Regeneration), stale-while-revalidate 전략을 적용한다.',
   2, 0, 2,
   '{"position":{"INFRA":45},"core":{"delivery":15,"problem_solving":5}}',
   '{"credits":90,"materials":{"infra_node":1}}'),

  ('IMPL_INFRA_006', 'implement', 'INFRA', 'Supabase Row Level Security 정책 구현',
   '전체 테이블의 RLS 정책을 구현한다. 공격자가 다른 사용자 데이터를 읽거나 쓸 수 없도록 auth.uid() 기반 정책을 모든 CRUD 작업에 적용한다.',
   3, -2, 3,
   '{"position":{"INFRA":70},"core":{"problem_solving":20,"delivery":10}}',
   '{"credits":140,"materials":{"infra_node":2,"deploy_key":1}}'),

-- IMPLEMENT / QA (6개)
  ('IMPL_QA_001', 'implement', 'QA', '단위 테스트 작성 - 게임 로직 함수',
   '런 점수 계산, 위험도 판정, 티켓 효과 적용 등 순수 함수에 대한 단위 테스트를 Vitest로 작성한다. 경계값과 엣지케이스를 집중적으로 커버한다.',
   3, -1, 2,
   '{"position":{"QA":55},"core":{"problem_solving":15,"delivery":10}}',
   '{"credits":110,"materials":{"test_crystal":2}}'),

  ('IMPL_QA_002', 'implement', 'QA', '통합 테스트 작성 - RPC 함수',
   'draw_ticket, submit_command, resolve_raid 등 Supabase RPC에 대한 통합 테스트를 작성한다. 테스트 DB에 seed 후 실제 함수를 호출하고 결과를 검증한다.',
   3, 0, 2,
   '{"position":{"QA":60},"core":{"problem_solving":20,"delivery":5}}',
   '{"credits":120,"materials":{"test_crystal":2}}'),

  ('IMPL_QA_003', 'implement', 'QA', 'Playwright E2E 테스트 - 런 진행 플로우',
   'Playwright로 런 시작 → 티켓 선택 → 페이즈 진행 → 런 완료 전체 플로우를 자동화한다. 모바일 뷰포트와 다크모드에서도 동작을 검증한다.',
   4, 1, 2,
   '{"position":{"QA":75},"core":{"delivery":20,"problem_solving":10}}',
   '{"credits":150,"materials":{"test_crystal":3}}'),

  ('IMPL_QA_004', 'implement', 'QA', 'API 계약 테스트 구현',
   'OpenAPI 명세 기반으로 API 응답 구조를 자동 검증하는 계약 테스트를 구현한다. 스키마 드리프트 감지 알림과 CI 통합을 포함한다.',
   3, -1, 3,
   '{"position":{"QA":60},"core":{"delivery":15,"problem_solving":10}}',
   '{"credits":120,"materials":{"test_crystal":2}}'),

  ('IMPL_QA_005', 'implement', 'QA', '접근성 자동화 테스트 구현',
   'axe-core와 Playwright를 결합해 주요 페이지의 A11y 위반을 자동으로 감지한다. CI 실패 조건(critical 위반 0건)과 보고서 아티팩트 저장을 설정한다.',
   2, -1, 3,
   '{"position":{"QA":45},"core":{"delivery":10,"design":10}}',
   '{"credits":90,"materials":{"test_crystal":1}}'),

  ('IMPL_QA_006', 'implement', 'QA', '테스트 픽스처 & 팩토리 라이브러리 구축',
   '반복되는 테스트 데이터 생성을 위한 팩토리 함수(createCharacter, createRun, createTicket)를 구현한다. faker.js를 활용해 현실적인 테스트 데이터를 생성한다.',
   2, -1, 2,
   '{"position":{"QA":40},"core":{"delivery":15}}',
   '{"credits":80,"materials":{"test_crystal":1}}'),

-- ============================================================
-- PHASE: TEST
-- ============================================================

-- TEST / FE (6개)
  ('TEST_FE_001', 'test', 'FE', '런 대시보드 시각적 회귀 테스트',
   'Playwright Screenshot 비교로 런 대시보드의 시각적 회귀를 방지한다. 각 지표 임계값(정상/경고/위험)별 스냅샷을 저장하고 변경 감지 시 슬랙 알림을 보낸다.',
   2, -1, 2,
   '{"position":{"FE":40},"core":{"delivery":10}}',
   '{"credits":80,"materials":{"test_crystal":1}}'),

  ('TEST_FE_002', 'test', 'FE', '플리키 테스트 수정 - 타이밍 의존 테스트',
   '타이밍/애니메이션 의존으로 간헐적으로 실패하는 E2E 테스트를 수정한다. waitForSelector를 waitForResponse로 교체하고 명시적 대기 조건을 재설정한다.',
   2, -2, 2,
   '{"position":{"FE":35},"core":{"debugging":20}}',
   '{"credits":70,"materials":{"debug_token":1}}'),

  ('TEST_FE_003', 'test', 'FE', '컴포넌트 렌더링 성능 프로파일링',
   'React DevTools Profiler로 티켓 선택 카드 렌더링 성능을 측정한다. 불필요한 리렌더링을 memo/useCallback으로 제거하고 개선 전후 지표를 문서화한다.',
   2, 0, 2,
   '{"position":{"FE":40},"core":{"problem_solving":15,"debugging":5}}',
   '{"credits":80,"materials":{"debug_token":1}}'),

  ('TEST_FE_004', 'test', 'FE', '크로스 브라우저 호환성 테스트',
   'Playwright로 Chrome, Firefox, Safari에서 핵심 기능 동작을 검증한다. 실시간 레이드 Realtime 기능의 브라우저별 WebSocket 동작을 중점 테스트한다.',
   3, 0, 2,
   '{"position":{"FE":50},"core":{"delivery":15,"debugging":10}}',
   '{"credits":100,"materials":{"test_crystal":1}}'),

  ('TEST_FE_005', 'test', 'FE', '오프라인 & 네트워크 불안정 시나리오 테스트',
   'Chrome DevTools 네트워크 스로틀링으로 3G, 오프라인 상황에서 UI 동작을 테스트한다. 재연결 시 데이터 동기화, 낙관적 업데이트 롤백을 검증한다.',
   3, 1, 1,
   '{"position":{"FE":50},"core":{"problem_solving":15,"debugging":10}}',
   '{"credits":100,"materials":{"test_crystal":1,"debug_token":1}}'),

  ('TEST_FE_006', 'test', 'FE', '다크모드 및 테마 전환 테스트',
   '라이트/다크 모드 전환 시 모든 컴포넌트의 색상 대비가 WCAG 기준을 만족하는지 자동화 테스트로 검증한다. 시스템 테마 변경 시나리오를 포함한다.',
   1, -1, 2,
   '{"position":{"FE":25},"core":{"design":10}}',
   '{"credits":50}'),

-- TEST / BE (6개)
  ('TEST_BE_001', 'test', 'BE', '런 상태 머신 경계값 통합 테스트',
   'risk=100(런 실패), quality=0, time=0 등 극단적 상황에서 런 종료 처리가 올바른지 통합 테스트로 검증한다. 동시 커맨드 제출 레이스 컨디션도 테스트한다.',
   3, -1, 2,
   '{"position":{"BE":55},"core":{"problem_solving":20,"debugging":10}}',
   '{"credits":110,"materials":{"test_crystal":2,"debug_token":1}}'),

  ('TEST_BE_002', 'test', 'BE', 'RLS 정책 침투 테스트',
   '다른 사용자 JWT로 타 캐릭터 데이터 접근을 시도하는 테스트를 작성한다. 모든 테이블의 SELECT/INSERT/UPDATE/DELETE RLS 정책이 올바르게 차단하는지 확인한다.',
   3, -2, 3,
   '{"position":{"BE":60},"core":{"problem_solving":20,"debugging":10}}',
   '{"credits":120,"materials":{"test_crystal":2,"debug_token":1}}'),

  ('TEST_BE_003', 'test', 'BE', '버그 재현 테스트 - 레이드 KPI 음수 버그',
   'KPI 값이 음수가 되는 버그를 재현하는 테스트를 먼저 작성하고 수정한다. CHECK 제약 추가, 클라이언트 검증 로직 강화 후 회귀 방지 테스트로 등록한다.',
   2, -1, 2,
   '{"position":{"BE":45},"core":{"debugging":20,"problem_solving":5}}',
   '{"credits":90,"materials":{"debug_token":2}}'),

  ('TEST_BE_004', 'test', 'BE', '멱등성 보장 스트레스 테스트',
   '동일 idempotency_key로 100개 동시 요청을 보내 정확히 1번만 처리되는지 검증한다. 데드락, 타임아웃, 오류 응답 분포를 측정하고 문서화한다.',
   3, 1, 1,
   '{"position":{"BE":60},"core":{"problem_solving":20,"debugging":10}}',
   '{"credits":120,"materials":{"test_crystal":2,"debug_token":1}}'),

  ('TEST_BE_005', 'test', 'BE', 'Edge Function 콜드 스타트 성능 측정',
   'Supabase Edge Function의 콜드 스타트 시간을 측정하고 번들 사이즈 최적화(트리쉐이킹, 동적 임포트)로 실행 시간을 줄인다. 개선 전후 벤치마크를 기록한다.',
   2, 0, 1,
   '{"position":{"BE":40},"core":{"problem_solving":15,"delivery":5}}',
   '{"credits":80,"materials":{"debug_token":1}}'),

  ('TEST_BE_006', 'test', 'BE', '데이터 마이그레이션 검증 테스트',
   '새로운 마이그레이션 적용 후 기존 데이터 무결성을 검증하는 자동화 스크립트를 작성한다. 외래키 참조, NOT NULL 제약, JSONB 구조를 체계적으로 검사한다.',
   2, -1, 3,
   '{"position":{"BE":45},"core":{"delivery":15,"problem_solving":10}}',
   '{"credits":90,"materials":{"test_crystal":1}}'),

-- TEST / INFRA (6개)
  ('TEST_INFRA_001', 'test', 'INFRA', '부하 테스트 - API 엔드포인트',
   'k6로 런 제출 API에 가상 사용자 500명 부하를 주어 p95 응답시간과 에러율을 측정한다. Supabase Connection Pooler 설정 최적화 결과를 포함한다.',
   4, 2, 1,
   '{"position":{"INFRA":75},"core":{"problem_solving":20,"delivery":10}}',
   '{"credits":150,"materials":{"test_crystal":2,"infra_node":1}}'),

  ('TEST_INFRA_002', 'test', 'INFRA', 'CI 파이프라인 실행 시간 최적화',
   '전체 CI 실행 시간을 15분 이하로 줄인다. 캐시 전략(pnpm store, Playwright 브라우저), 테스트 병렬화, 불필요한 단계 제거를 적용하고 개선 결과를 측정한다.',
   2, 0, 2,
   '{"position":{"INFRA":45},"core":{"delivery":20}}',
   '{"credits":90,"materials":{"infra_node":1}}'),

  ('TEST_INFRA_003', 'test', 'INFRA', 'DB 백업 복구 드릴 실행',
   'Supabase 포인트인타임 복구를 staging 환경에서 실제로 수행한다. 복구 소요 시간을 측정하고 RTO 목표 달성 여부를 확인한다. 드릴 결과 보고서를 작성한다.',
   3, -2, 3,
   '{"position":{"INFRA":65},"core":{"delivery":20,"problem_solving":5}}',
   '{"credits":130,"materials":{"infra_node":2}}'),

  ('TEST_INFRA_004', 'test', 'INFRA', '보안 스캐닝 - 의존성 취약점 검사',
   'npm audit, Snyk, Trivy로 의존성 취약점을 스캔한다. Critical/High 취약점을 모두 해소하고 주간 자동 스캔을 CI에 통합한다.',
   2, -2, 2,
   '{"position":{"INFRA":45},"core":{"delivery":10,"problem_solving":10}}',
   '{"credits":90,"materials":{"infra_node":1,"test_crystal":1}}'),

  ('TEST_INFRA_005', 'test', 'INFRA', '인프라 구성 드리프트 감지 테스트',
   'Supabase CLI로 로컬 마이그레이션과 원격 DB 스키마의 드리프트를 감지하는 체크를 CI에 추가한다. 드리프트 발생 시 PR 머지를 차단한다.',
   2, -1, 2,
   '{"position":{"INFRA":45},"core":{"delivery":15}}',
   '{"credits":90,"materials":{"infra_node":1}}'),

  ('TEST_INFRA_006', 'test', 'INFRA', '재해복구 시나리오 시뮬레이션',
   '프로덕션 DB 장애를 가정한 재해복구 시나리오를 staging에서 시뮬레이션한다. 페일오버 절차, 데이터 손실 최소화, 사용자 알림 프로세스를 검증한다.',
   4, -2, 3,
   '{"position":{"INFRA":80},"core":{"delivery":25,"problem_solving":10}}',
   '{"credits":160,"materials":{"infra_node":3,"deploy_key":1}}'),

-- TEST / QA (6개)
  ('TEST_QA_001', 'test', 'QA', '전체 게임 플로우 E2E 회귀 테스트',
   '회원가입 → 캐릭터 생성 → 런 시작 → 5 페이즈 완주 → 결과 확인의 전체 플로우를 E2E 자동화 테스트로 회귀 검증한다. 릴리즈 전 필수 실행 게이트로 등록한다.',
   4, -1, 3,
   '{"position":{"QA":80},"core":{"delivery":20,"problem_solving":10}}',
   '{"credits":160,"materials":{"test_crystal":3}}'),

  ('TEST_QA_002', 'test', 'QA', '레이드 멀티플레이어 시나리오 테스트',
   '4인 레이드를 시뮬레이션하는 통합 테스트를 작성한다. 동시 액션 처리, KPI 동기화 정확도, 타임아웃 시 자동 종료를 다양한 시나리오로 검증한다.',
   4, 1, 2,
   '{"position":{"QA":75},"core":{"problem_solving":20,"debugging":10}}',
   '{"credits":150,"materials":{"test_crystal":3,"debug_token":1}}'),

  ('TEST_QA_003', 'test', 'QA', '탐색적 테스트 세션 실행 - 경제 시스템',
   '마켓 리스팅, 컨트랙트 이행, 인벤토리 전송의 경계 케이스를 탐색적으로 테스트한다. 가격 0원 등록, 음수 수량, 만료된 컨트랙트 시나리오를 포함한다.',
   3, 0, 2,
   '{"position":{"QA":55},"core":{"problem_solving":15,"debugging":10}}',
   '{"credits":110,"materials":{"test_crystal":2}}'),

  ('TEST_QA_004', 'test', 'QA', 'PvP 공정성 검증 테스트',
   'PvP golf 모드와 speedrun 모드의 점수 계산 공정성을 검증한다. 동일 시드에서 동일 커맨드 시퀀스가 항상 동일 점수를 생성하는지 결정론적 재현 테스트를 수행한다.',
   3, -1, 3,
   '{"position":{"QA":60},"core":{"problem_solving":20,"delivery":5}}',
   '{"credits":120,"materials":{"test_crystal":2}}'),

  ('TEST_QA_005', 'test', 'QA', '성능 회귀 테스트 구현',
   'Lighthouse CI를 PR 파이프라인에 통합해 성능 점수(Performance, LCP, CLS)가 기준치 아래로 떨어지면 PR을 차단한다. 주요 페이지별 예산을 설정한다.',
   2, -1, 2,
   '{"position":{"QA":45},"core":{"delivery":15}}',
   '{"credits":90,"materials":{"test_crystal":1}}'),

  ('TEST_QA_006', 'test', 'QA', '버그 재현 환경 자동화 - 티켓 시스템',
   '보고된 버그를 빠르게 재현할 수 있는 시나리오 스크립트를 작성한다. 특정 시드와 커맨드 시퀀스로 버그 상태를 즉시 재현하고 수정 검증을 자동화한다.',
   2, -1, 2,
   '{"position":{"QA":40},"core":{"debugging":20}}',
   '{"credits":80,"materials":{"debug_token":2}}'),

-- ============================================================
-- PHASE: DEPLOY
-- ============================================================

-- DEPLOY / FE (6개)
  ('DEPLOY_FE_001', 'deploy', 'FE', 'Vercel 카나리 배포 설정',
   'Vercel Edge Config으로 신규 기능을 전체 트래픽의 5%에만 노출하는 카나리 배포를 설정한다. 에러율 임계값 초과 시 자동 롤백 조건을 구성한다.',
   3, 1, 1,
   '{"position":{"FE":55},"core":{"delivery":20}}',
   '{"credits":110,"materials":{"deploy_key":1}}'),

  ('DEPLOY_FE_002', 'deploy', 'FE', '피처 플래그 시스템 적용',
   '신규 레이드 UI를 피처 플래그로 감싸 점진적으로 노출한다. 사용자 세그먼트(내부/베타/전체)별 플래그 상태를 관리하고 롤백 없이 기능을 끌 수 있게 한다.',
   2, 0, 2,
   '{"position":{"FE":45},"core":{"delivery":15}}',
   '{"credits":90,"materials":{"deploy_key":1}}'),

  ('DEPLOY_FE_003', 'deploy', 'FE', '프론트엔드 번들 최적화',
   '번들 분석(next bundle-analyzer)으로 큰 청크를 식별하고 dynamic import, 코드 스플리팅을 적용한다. 초기 번들 크기를 200KB(gzip) 이하로 줄인다.',
   2, 0, 2,
   '{"position":{"FE":45},"core":{"delivery":10,"problem_solving":10}}',
   '{"credits":90}'),

  ('DEPLOY_FE_004', 'deploy', 'FE', '블루-그린 배포 전환 검증',
   '블루(현재)에서 그린(신규) 버전으로 전환 시 세션 손실, 실시간 연결 끊김이 발생하지 않는지 검증한다. 전환 전후 주요 지표(에러율, 응답시간)를 모니터링한다.',
   3, 1, 1,
   '{"position":{"FE":50},"core":{"delivery":15,"problem_solving":5}}',
   '{"credits":100,"materials":{"deploy_key":1}}'),

  ('DEPLOY_FE_005', 'deploy', 'FE', '정적 자산 캐시 무효화 전략 적용',
   '빌드 해시 기반 정적 자산 네이밍으로 캐시 버스팅을 자동화한다. 배포 후 이전 버전 자산이 CDN에 남아있는 기간을 모니터링하고 적절한 max-age를 설정한다.',
   2, -1, 2,
   '{"position":{"FE":40},"core":{"delivery":15}}',
   '{"credits":80}'),

  ('DEPLOY_FE_006', 'deploy', 'FE', '배포 후 스모크 테스트 자동화',
   '배포 완료 후 자동으로 실행되는 스모크 테스트 스크립트를 작성한다. 핵심 페이지 로딩, API 헬스체크, 실시간 연결 확인을 포함하고 실패 시 즉시 롤백을 트리거한다.',
   2, -1, 2,
   '{"position":{"FE":40},"core":{"delivery":20}}',
   '{"credits":80,"materials":{"deploy_key":1,"test_crystal":1}}'),

-- DEPLOY / BE (6개)
  ('DEPLOY_BE_001', 'deploy', 'BE', 'DB 마이그레이션 무중단 배포 절차',
   '테이블 스키마 변경을 다운타임 없이 배포하는 절차를 수립한다. 확장-수축(expand-contract) 패턴으로 컬럼 추가, 데이터 마이그레이션, 구 컬럼 제거를 단계적으로 진행한다.',
   4, 2, 2,
   '{"position":{"BE":80},"core":{"delivery":20,"problem_solving":15}}',
   '{"credits":160,"materials":{"deploy_key":2,"circuit_board":1}}'),

  ('DEPLOY_BE_002', 'deploy', 'BE', 'Edge Function 배포 및 버전 관리',
   'Supabase Edge Function의 버전별 배포 이력을 관리한다. 신구 버전 공존 기간 동안 라우팅 전략, 빠른 롤백 방법, 함수 간 의존성 버전 호환성을 문서화한다.',
   3, 1, 1,
   '{"position":{"BE":60},"core":{"delivery":15}}',
   '{"credits":120,"materials":{"deploy_key":1}}'),

  ('DEPLOY_BE_003', 'deploy', 'BE', '롤백 플랜 수립 및 검증',
   '모든 변경사항에 대한 롤백 플랜을 작성한다. DB 마이그레이션 롤백, Edge Function 이전 버전 복원, 피처 플래그 비활성화의 단계별 절차와 검증 기준을 포함한다.',
   2, -2, 2,
   '{"position":{"BE":45},"core":{"delivery":20}}',
   '{"credits":90,"materials":{"deploy_key":1}}'),

  ('DEPLOY_BE_004', 'deploy', 'BE', '환경 설정 감사 (Config Audit)',
   '프로덕션 환경의 모든 설정값(DB 커넥션 풀, 타임아웃, RLS 정책)이 설계 문서와 일치하는지 감사한다. 불일치 항목을 추적하고 수정 우선순위를 매긴다.',
   2, -1, 2,
   '{"position":{"BE":40},"core":{"delivery":15}}',
   '{"credits":80}'),

  ('DEPLOY_BE_005', 'deploy', 'BE', '데이터베이스 성능 튜닝 배포',
   '쿼리 분석으로 발견된 슬로우 쿼리에 인덱스를 추가하는 마이그레이션을 배포한다. CONCURRENTLY 옵션으로 무중단 인덱스 생성, 적용 후 쿼리 실행계획 재확인을 한다.',
   3, 0, 2,
   '{"position":{"BE":60},"core":{"problem_solving":15,"delivery":10}}',
   '{"credits":120,"materials":{"circuit_board":1}}'),

  ('DEPLOY_BE_006', 'deploy', 'BE', 'API 속도 제한(Rate Limiting) 배포',
   'Supabase API Gateway 레벨에서 IP/사용자별 Rate Limiting을 설정한다. 정상 게임 플레이는 차단하지 않으면서 악의적 대량 요청을 차단하는 임계값을 설정한다.',
   2, -1, 2,
   '{"position":{"BE":45},"core":{"delivery":10,"problem_solving":10}}',
   '{"credits":90,"materials":{"deploy_key":1}}'),

-- DEPLOY / INFRA (6개)
  ('DEPLOY_INFRA_001', 'deploy', 'INFRA', '프로덕션 인프라 롤아웃 자동화',
   'Terraform 또는 Supabase CLI를 활용해 프로덕션 인프라 변경을 코드로 관리하고 자동화한다. Plan → Approve → Apply 워크플로우로 변경 사항을 안전하게 배포한다.',
   4, 1, 2,
   '{"position":{"INFRA":80},"core":{"delivery":20,"problem_solving":10}}',
   '{"credits":160,"materials":{"infra_node":3,"deploy_key":2}}'),

  ('DEPLOY_INFRA_002', 'deploy', 'INFRA', '로그 집계 파이프라인 구축',
   'Vercel Log Drains와 Supabase pg_audit 로그를 Datadog 또는 Logtail로 수집한다. 에러/경고 로그 자동 알림 규칙과 로그 보존 정책을 설정한다.',
   3, -1, 2,
   '{"position":{"INFRA":65},"core":{"delivery":15}}',
   '{"credits":130,"materials":{"infra_node":2}}'),

  ('DEPLOY_INFRA_003', 'deploy', 'INFRA', '헬스체크 엔드포인트 배포',
   '/api/health 엔드포인트를 구현하고 Vercel Monitoring과 연동한다. DB 연결, Edge Function 응답, 외부 서비스 상태를 포함한 종합 헬스 상태를 반환한다.',
   2, -1, 2,
   '{"position":{"INFRA":45},"core":{"delivery":15}}',
   '{"credits":90,"materials":{"infra_node":1}}'),

  ('DEPLOY_INFRA_004', 'deploy', 'INFRA', 'CDN 엣지 캐싱 규칙 프로덕션 적용',
   'Vercel Edge Network에 정적 자산(TTL 1년), API 응답(stale-while-revalidate 60초), 사용자별 캐시 제외 규칙을 프로덕션에 적용하고 캐시 히트율을 측정한다.',
   2, 0, 2,
   '{"position":{"INFRA":45},"core":{"delivery":15}}',
   '{"credits":90,"materials":{"infra_node":1}}'),

  ('DEPLOY_INFRA_005', 'deploy', 'INFRA', 'Supabase Connection Pooler 프로덕션 설정',
   'pgBouncer Connection Pooler를 프로덕션 트래픽에 맞게 튜닝한다. pool_size, max_client_conn, pool_mode(transaction)를 설정하고 연결 고갈 시나리오를 테스트한다.',
   3, 1, 1,
   '{"position":{"INFRA":65},"core":{"problem_solving":15,"delivery":10}}',
   '{"credits":130,"materials":{"infra_node":2}}'),

  ('DEPLOY_INFRA_006', 'deploy', 'INFRA', '배포 알림 & 변경 이력 자동화',
   '배포 완료 시 Slack 채널에 배포 버전, 변경 요약, 담당자를 자동 통보하는 웹훅을 구현한다. 배포 이력을 Github Releases에 자동 태깅하고 Changelog를 생성한다.',
   2, -1, 1,
   '{"position":{"INFRA":40},"core":{"delivery":15}}',
   '{"credits":80,"materials":{"deploy_key":1}}'),

-- DEPLOY / QA (6개)
  ('DEPLOY_QA_001', 'deploy', 'QA', 'Staging 환경 배포 전 검증 게이트',
   'Staging 배포 후 자동 회귀 테스트 스위트를 실행한다. 실패 시 프로덕션 배포를 차단하는 파이프라인 게이트를 구성하고 결과 보고서를 자동 생성한다.',
   3, -1, 3,
   '{"position":{"QA":60},"core":{"delivery":20}}',
   '{"credits":120,"materials":{"test_crystal":2,"deploy_key":1}}'),

  ('DEPLOY_QA_002', 'deploy', 'QA', '카나리 배포 모니터링 및 검증',
   '카나리 배포 기간 중 에러율, 응답시간, 사용자 불만 지표를 모니터링한다. 임계값 초과 시 자동 롤백 트리거와 수동 롤백 절차를 문서화한다.',
   2, 0, 2,
   '{"position":{"QA":45},"core":{"delivery":15,"problem_solving":5}}',
   '{"credits":90,"materials":{"test_crystal":1}}'),

  ('DEPLOY_QA_003', 'deploy', 'QA', '배포 후 프로덕션 스모크 테스트',
   '프로덕션 배포 직후 실제 사용자 계정으로 핵심 기능(런 시작, 티켓 선택, 레이드 참여)을 검증하는 스모크 테스트 체크리스트를 실행한다.',
   2, -1, 2,
   '{"position":{"QA":40},"core":{"delivery":15}}',
   '{"credits":80,"materials":{"test_crystal":1}}'),

  ('DEPLOY_QA_004', 'deploy', 'QA', '롤백 시나리오 검증 테스트',
   '롤백 발생 시 진행 중인 런, 레이드, PvP 매치 데이터가 손상되지 않는지 검증한다. 롤백 직전/직후 데이터 정합성 체크 쿼리를 자동화한다.',
   3, -1, 2,
   '{"position":{"QA":55},"core":{"delivery":15,"problem_solving":10}}',
   '{"credits":110,"materials":{"test_crystal":2,"debug_token":1}}'),

  ('DEPLOY_QA_005', 'deploy', 'QA', '피처 플래그 A/B 테스트 설계',
   '신규 UI 변경의 효과를 측정하는 A/B 테스트를 설계한다. 실험 목표(런 완주율 향상), 표본 크기 계산, 유의미성 판단 기준, 데이터 수집 방법을 정의한다.',
   2, 0, 2,
   '{"position":{"QA":45},"core":{"design":15,"problem_solving":5}}',
   '{"credits":90,"materials":{"plan_scroll":1}}'),

  ('DEPLOY_QA_006', 'deploy', 'QA', '배포 체크리스트 자동화',
   '배포 전 수동 확인 항목(마이그레이션 검토, 환경변수 확인, 롤백 플랜 존재 여부)을 자동화된 체크리스트 도구로 전환하고 Github PR 템플릿에 통합한다.',
   1, -1, 2,
   '{"position":{"QA":25},"core":{"delivery":10}}',
   '{"credits":50,"materials":{"test_crystal":1}}'),

-- ============================================================
-- PHASE: OPERATE
-- ============================================================

-- OPERATE / FE (6개)
  ('OPS_FE_001', 'operate', 'FE', '프론트엔드 에러 추적 대시보드 구성',
   'Sentry 대시보드에서 FE 에러를 컴포넌트별, 브라우저별로 분류하는 커스텀 뷰를 설정한다. 주간 에러 트렌드 보고서를 자동 생성해 팀 슬랙 채널에 발송한다.',
   2, -1, 2,
   '{"position":{"FE":40},"core":{"delivery":15}}',
   '{"credits":80,"materials":{"debug_token":1}}'),

  ('OPS_FE_002', 'operate', 'FE', 'Core Web Vitals 지속 모니터링',
   'Vercel Analytics와 RUM(Real User Monitoring)으로 실제 사용자 LCP, FID, CLS를 추적한다. 성능 저하 감지 시 알림을 보내고 회귀 원인을 분석한다.',
   2, -1, 2,
   '{"position":{"FE":40},"core":{"delivery":10,"problem_solving":5}}',
   '{"credits":80}'),

  ('OPS_FE_003', 'operate', 'FE', '프론트엔드 긴급 핫픽스 파이프라인',
   '크리티컬 버그 발생 시 일반 릴리즈 사이클을 우회해 빠르게 배포할 수 있는 핫픽스 브랜치 전략과 파이프라인을 구성한다. 핫픽스 후 메인 브랜치 백머지 절차를 포함한다.',
   2, 1, 1,
   '{"position":{"FE":40},"core":{"delivery":20}}',
   '{"credits":80,"materials":{"debug_token":1,"deploy_key":1}}'),

  ('OPS_FE_004', 'operate', 'FE', '사용자 행동 분석 데이터 수집',
   '런 중 사용자 티켓 선택 패턴, 이탈 지점, 세션 시간을 수집한다. 개인정보 보호(익명화)를 지키며 게임 밸런스 개선에 활용할 인사이트를 추출한다.',
   2, 0, 1,
   '{"position":{"FE":35},"core":{"delivery":10,"design":5}}',
   '{"credits":70}'),

  ('OPS_FE_005', 'operate', 'FE', '번들 크기 지속 관리 자동화',
   'bundlesize 또는 size-limit으로 PR마다 번들 크기 변화를 추적한다. 기준치(+5KB) 초과 시 PR에 경고 코멘트를 남기고 리뷰어의 승인을 요구하도록 설정한다.',
   1, -1, 2,
   '{"position":{"FE":25},"core":{"delivery":10}}',
   '{"credits":50}'),

  ('OPS_FE_006', 'operate', 'FE', '프론트엔드 로그 로테이션 및 정리',
   '클라이언트 사이드 로그(console.error 캡처)의 보존 기간을 Sentry retention 정책으로 관리한다. 비용을 고려해 info 레벨 이하 로그의 샘플링 비율을 조정한다.',
   1, -1, 1,
   '{"position":{"FE":20},"core":{"delivery":10}}',
   '{"credits":40}'),

-- OPERATE / BE (6개)
  ('OPS_BE_001', 'operate', 'BE', '슬로우 쿼리 알림 및 자동 분석',
   'pg_stat_statements로 슬로우 쿼리(>500ms)를 감지하고 Slack 알림과 함께 자동으로 EXPLAIN ANALYZE 결과를 첨부하는 모니터링 함수를 구현한다.',
   3, -1, 2,
   '{"position":{"BE":55},"core":{"problem_solving":20,"debugging":10}}',
   '{"credits":110,"materials":{"debug_token":1,"circuit_board":1}}'),

  ('OPS_BE_002', 'operate', 'BE', '인시던트 리뷰 및 포스트모템 작성',
   '발생한 인시던트(레이드 KPI 동기화 오류)에 대한 포스트모템을 작성한다. 타임라인 재구성, 근본 원인 분석(5-why), 재발 방지 액션 아이템을 팀과 공유한다.',
   3, -2, 2,
   '{"position":{"BE":50},"core":{"problem_solving":20,"collaboration":10}}',
   '{"credits":100,"materials":{"debug_token":2}}'),

  ('OPS_BE_003', 'operate', 'BE', 'DB 용량 계획 및 파티셔닝 검토',
   'run_commands 테이블의 증가 속도를 분석하고 6개월 후 용량을 예측한다. 오래된 런 데이터의 아카이빙 전략과 테이블 파티셔닝(날짜 기반) 적용 계획을 수립한다.',
   3, 0, 2,
   '{"position":{"BE":55},"core":{"delivery":15,"problem_solving":10}}',
   '{"credits":110,"materials":{"circuit_board":1}}'),

  ('OPS_BE_004', 'operate', 'BE', 'API 비용 최적화 - 불필요한 쿼리 제거',
   '프로덕션 쿼리 로그를 분석해 N+1 쿼리, 중복 SELECT, 과도한 JOIN을 찾아 최적화한다. 월간 Supabase 사용량 비용 리포트로 절감 효과를 측정한다.',
   3, -1, 2,
   '{"position":{"BE":55},"core":{"problem_solving":20,"delivery":5}}',
   '{"credits":110,"materials":{"circuit_board":1}}'),

  ('OPS_BE_005', 'operate', 'BE', '분산 추적(Distributed Tracing) 추가',
   'Edge Function 요청에 trace-id 헤더를 추가하고 Sentry Performance 또는 OpenTelemetry로 요청 흐름을 추적한다. 느린 트랜잭션의 병목을 시각적으로 파악한다.',
   3, -1, 2,
   '{"position":{"BE":60},"core":{"problem_solving":15,"debugging":10}}',
   '{"credits":120,"materials":{"circuit_board":1,"debug_token":1}}'),

  ('OPS_BE_006', 'operate', 'BE', '배치 정리 Job 운영 안정화',
   'pg_cron으로 실행되는 배치 Job(통계 집계, 만료 컨트랙트 정리, 오래된 런 이벤트 삭제)의 실행 이력을 모니터링하고 실패 시 자동 재시도 및 알림 로직을 추가한다.',
   2, -1, 2,
   '{"position":{"BE":45},"core":{"delivery":15}}',
   '{"credits":90,"materials":{"circuit_board":1}}'),

-- OPERATE / INFRA (6개)
  ('OPS_INFRA_001', 'operate', 'INFRA', '알림 임계값 튜닝',
   '초기 알림 설정의 오탐(False Positive)을 분석해 임계값을 조정한다. 에러율, 응답시간, DB 연결 수 알림의 임계값을 실제 트래픽 패턴 기반으로 재설정한다.',
   2, -2, 2,
   '{"position":{"INFRA":40},"core":{"delivery":15,"problem_solving":5}}',
   '{"credits":80,"materials":{"infra_node":1}}'),

  ('OPS_INFRA_002', 'operate', 'INFRA', 'Supabase Edge Function 트레이싱 추가',
   'Edge Function에 OpenTelemetry 계측을 추가한다. 함수 실행 시간, 에러 발생률, DB 호출 횟수를 추적하고 Honeycomb 또는 Grafana Cloud로 시각화한다.',
   3, 0, 2,
   '{"position":{"INFRA":60},"core":{"delivery":15,"problem_solving":10}}',
   '{"credits":120,"materials":{"infra_node":2,"debug_token":1}}'),

  ('OPS_INFRA_003', 'operate', 'INFRA', '인프라 비용 최적화 실행',
   'Vercel Analytics, Supabase Compute 비용을 분석해 불필요한 리소스를 줄인다. 로그 보존 기간 단축, 불필요한 Edge Function 제거, DB 쿼리 최적화로 월 비용을 절감한다.',
   2, -1, 1,
   '{"position":{"INFRA":40},"core":{"delivery":15}}',
   '{"credits":80,"materials":{"infra_node":1}}'),

  ('OPS_INFRA_004', 'operate', 'INFRA', '로그 로테이션 정책 적용',
   'Supabase DB 로그와 Vercel Function 로그의 보존 기간 정책을 설정한다. GDPR 준수를 위한 사용자 데이터 자동 삭제 스케줄과 익명화 정책을 구현한다.',
   2, -1, 2,
   '{"position":{"INFRA":40},"core":{"delivery":10}}',
   '{"credits":80,"materials":{"infra_node":1}}'),

  ('OPS_INFRA_005', 'operate', 'INFRA', '용량 계획 리뷰 및 스케일 준비',
   '현재 트래픽 증가 추세를 분석해 3개월 후 필요한 리소스를 예측한다. Supabase Pro 플랜 업그레이드 시점, Vercel Enterprise 전환 필요성을 팀에 보고한다.',
   2, 0, 1,
   '{"position":{"INFRA":40},"core":{"delivery":15,"problem_solving":5}}',
   '{"credits":80}'),

  ('OPS_INFRA_006', 'operate', 'INFRA', '보안 패치 자동화 파이프라인 구축',
   'Dependabot PR 자동 머지(패치 버전), 주간 Snyk 스캔, OS 이미지 최신화를 자동화한다. Critical CVE 발생 시 긴급 패치 파이프라인을 24시간 내 실행하는 프로세스를 수립한다.',
   3, -2, 3,
   '{"position":{"INFRA":65},"core":{"delivery":20,"problem_solving":5}}',
   '{"credits":130,"materials":{"infra_node":2,"deploy_key":1}}'),

-- OPERATE / QA (6개)
  ('OPS_QA_001', 'operate', 'QA', '프로덕션 에러율 주간 리뷰',
   '매주 Sentry 에러 보고서를 분석해 신규 에러, 에러율 증가 추세, 미해결 이슈를 팀에 공유한다. 우선순위 기반 버그 수정 스프린트 계획을 제안한다.',
   1, -1, 2,
   '{"position":{"QA":25},"core":{"delivery":10,"collaboration":5}}',
   '{"credits":50}'),

  ('OPS_QA_002', 'operate', 'QA', '인시던트 재현 및 회귀 방지 테스트',
   '프로덕션에서 발생한 인시던트를 테스트 환경에서 재현하고 회귀 테스트를 자동화 스위트에 추가한다. 동일 버그의 재발 가능성을 제로로 만드는 것을 목표로 한다.',
   3, -1, 2,
   '{"position":{"QA":55},"core":{"debugging":20,"delivery":10}}',
   '{"credits":110,"materials":{"debug_token":2,"test_crystal":1}}'),

  ('OPS_QA_003', 'operate', 'QA', '정기 보안 취약점 스캔 및 보고',
   '월 1회 OWASP ZAP으로 프로덕션 API를 스캔한다. 발견된 취약점을 심각도별로 분류하고 수정 기한을 설정해 보안 백로그를 관리한다.',
   2, -2, 2,
   '{"position":{"QA":40},"core":{"delivery":10,"problem_solving":10}}',
   '{"credits":80,"materials":{"test_crystal":1}}'),

  ('OPS_QA_004', 'operate', 'QA', '게임 밸런스 데이터 분석 및 리포팅',
   '티켓별 선택률, 런 완주율, 포지션별 평균 점수를 분석해 게임 밸런스 리포트를 작성한다. 이상치 데이터(특정 티켓 선택 집중)를 감지하고 밸런스 조정을 제안한다.',
   2, -1, 2,
   '{"position":{"QA":40},"core":{"problem_solving":15,"delivery":5}}',
   '{"credits":80}'),

  ('OPS_QA_005', 'operate', 'QA', '테스트 스위트 유지보수 및 플리키 수정',
   '지난 한 달간 간헐적으로 실패한 테스트를 집중 수정한다. 타이밍 문제, 환경 의존성, 데이터 격리 문제를 해결하고 CI 안정성(그린 빌드율)을 95% 이상으로 유지한다.',
   2, -1, 2,
   '{"position":{"QA":40},"core":{"debugging":15,"delivery":5}}',
   '{"credits":80,"materials":{"debug_token":1}}'),

  ('OPS_QA_006', 'operate', 'QA', '사용자 피드백 기반 탐색적 테스트',
   '사용자 버그 리포트와 지원 문의를 분석해 재현 가능한 케이스를 탐색적 테스트로 전환한다. 반복 문의가 많은 플로우를 자동화 테스트로 등록해 지속적으로 보호한다.',
   2, -1, 2,
   '{"position":{"QA":40},"core":{"debugging":10,"delivery":10,"collaboration":5}}',
   '{"credits":80,"materials":{"test_crystal":1}}')

ON CONFLICT (ticket_key) DO UPDATE SET
  title              = EXCLUDED.title,
  description        = EXCLUDED.description,
  base_time_cost     = EXCLUDED.base_time_cost,
  base_risk_delta    = EXCLUDED.base_risk_delta,
  base_quality_delta = EXCLUDED.base_quality_delta,
  reward_xp          = EXCLUDED.reward_xp,
  reward_items       = EXCLUDED.reward_items,
  version            = public.tickets.version + 1;
