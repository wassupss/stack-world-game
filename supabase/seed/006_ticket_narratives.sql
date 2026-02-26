-- ============================================================
-- 006_ticket_narratives.sql: 티켓 결과별 내러티브 문구 (120개)
-- critical / success / fail / fumble 4가지 결과 메시지
-- ============================================================

-- ============================================================
-- PHASE: PLAN — FE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"와이어프레임이 군더더기 없이 완성됐습니다! 사용자 플로우가 한눈에 들어와요. 대성공!","success":"와이어프레임 초안을 성공적으로 작성했습니다.","fail":"와이어프레임이 불명확해 수정이 필요합니다.","fumble":"와이어프레임이 엉망이 됐습니다! 처음부터 다시 그려야 할 것 같아요."}'
WHERE ticket_key = 'PLAN_FE_001';

UPDATE public.tickets SET narratives = '{"critical":"디자인 시스템 스코프가 완벽하게 정의됐습니다! 개발 속도가 확 빨라질 것입니다. 대성공!","success":"컴포넌트 범위와 토큰 체계를 명확히 정의했습니다.","fail":"스코프가 너무 넓어 우선순위 재조정이 필요합니다.","fumble":"디자인 시스템 방향성이 충돌했습니다! 팀 내 합의가 깨졌어요."}'
WHERE ticket_key = 'PLAN_FE_002';

UPDATE public.tickets SET narratives = '{"critical":"라우팅 구조를 군더더기 없이 설계했습니다! 인증 로직도 완벽해요. 대성공!","success":"페이지 트리와 인증 라우트를 체계적으로 설계했습니다.","fail":"일부 엣지 케이스에서 라우팅 충돌이 예상됩니다.","fumble":"라우팅 설계가 복잡하게 꼬였습니다! 구현 단계에서 문제가 생길 것 같아요."}'
WHERE ticket_key = 'PLAN_FE_003';

UPDATE public.tickets SET narratives = '{"critical":"최적의 상태 관리 전략을 찾았습니다! Zustand로 깔끔하게 정리됐어요. 대성공!","success":"상태 관리 방식을 결정하고 명세를 완성했습니다.","fail":"상태 관리 전략이 모호해 팀원들의 혼란이 예상됩니다.","fumble":"상태 관리 전략 논쟁이 길어졌습니다! 결론 없이 시간만 소비했어요."}'
WHERE ticket_key = 'PLAN_FE_004';

UPDATE public.tickets SET narratives = '{"critical":"애니메이션 사양이 완벽합니다! 성능 목표까지 달성할 수 있는 설계예요. 대성공!","success":"애니메이션 스펙을 문서화하고 Framer Motion 적용 계획을 세웠습니다.","fail":"일부 애니메이션이 성능 목표를 초과할 것 같아 조정이 필요합니다.","fumble":"애니메이션 요구사항이 과도합니다! 구현하면 앱이 느려질 것 같아요."}'
WHERE ticket_key = 'PLAN_FE_005';

UPDATE public.tickets SET narratives = '{"critical":"WCAG AA 기준을 완벽하게 충족하는 요구사항을 작성했습니다! 대성공!","success":"접근성 요구사항을 체계적으로 문서화했습니다.","fail":"일부 접근성 기준이 누락돼 추가 검토가 필요합니다.","fumble":"접근성 요구사항이 너무 복잡해졌습니다! 팀이 부담을 느끼고 있어요."}'
WHERE ticket_key = 'PLAN_FE_006';

-- ============================================================
-- PHASE: PLAN — BE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"OpenAPI 명세가 완벽합니다! 모든 엔드포인트 스키마가 명확해요. 대성공!","success":"API 계약서 초안을 완성하고 검토를 요청했습니다.","fail":"일부 API 스키마가 불완전해 추가 작업이 필요합니다.","fumble":"API 계약서에 심각한 오류가 있습니다! 전체를 재작성해야 할 것 같아요."}'
WHERE ticket_key = 'PLAN_BE_001';

UPDATE public.tickets SET narratives = '{"critical":"ER 다이어그램이 최적화됐습니다! 인덱스 전략까지 완벽해요. 대성공!","success":"핵심 엔티티의 데이터 모델을 설계하고 정규화를 완료했습니다.","fail":"일부 관계 정의가 모호해 쿼리 최적화가 어려울 수 있습니다.","fumble":"데이터 모델에 근본적인 문제가 발생했습니다! 나중에 마이그레이션이 어려울 것 같아요."}'
WHERE ticket_key = 'PLAN_BE_002';

UPDATE public.tickets SET narratives = '{"critical":"게임루프 상태 머신이 완벽하게 명세됐습니다! 엣지 케이스도 모두 처리했어요. 대성공!","success":"런 상태 머신을 명세하고 서버사이드 검증 범위를 정했습니다.","fail":"일부 페이즈 전환 로직이 불분명해 구현 시 혼란이 예상됩니다.","fumble":"게임루프 명세가 너무 복잡해졌습니다! 팀이 이해하기 어렵습니다."}'
WHERE ticket_key = 'PLAN_BE_003';

UPDATE public.tickets SET narratives = '{"critical":"인증 흐름이 완벽하게 설계됐습니다! RLS 정책도 빈틈없어요. 대성공!","success":"OAuth 플로우와 RLS 정책 원칙을 문서화했습니다.","fail":"인증 예외 케이스가 누락됐습니다. 보안 검토가 추가로 필요합니다.","fumble":"인증 정책에 치명적인 허점이 발견됐습니다! 보안 위험이 높아요."}'
WHERE ticket_key = 'PLAN_BE_004';

UPDATE public.tickets SET narratives = '{"critical":"리스크를 조기에 모두 발굴했습니다! 완화 전략까지 완벽해요. 대성공!","success":"기술 부채와 의존성 리스크를 식별하고 완화 전략을 세웠습니다.","fail":"중요한 리스크가 몇 가지 누락됐습니다. 추가 발굴이 필요합니다.","fumble":"리스크 식별이 너무 불완전합니다! 나중에 예상치 못한 문제가 터질 것 같아요."}'
WHERE ticket_key = 'PLAN_BE_005';

UPDATE public.tickets SET narratives = '{"critical":"이벤트 소싱 적용 범위가 최적으로 결정됐습니다! 장단점 분석도 완벽해요. 대성공!","success":"이벤트 소싱 패턴의 적용 범위를 팀과 합의했습니다.","fail":"이벤트 소싱 범위에 대한 팀 내 의견이 엇갈려 재검토가 필요합니다.","fumble":"이벤트 소싱 도입이 과도하게 복잡해졌습니다! 오버엔지니어링 위험이 있어요."}'
WHERE ticket_key = 'PLAN_BE_006';

-- ============================================================
-- PHASE: PLAN — INFRA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"dev/staging/prod 환경이 완벽하게 분리됐습니다! 운영 사고가 줄어들 것입니다. 대성공!","success":"Supabase 환경 분리 계획을 수립하고 팀에 공유했습니다.","fail":"환경 분리 기준이 모호해 이후 혼란이 예상됩니다.","fumble":"환경 분리 계획이 실현 불가능합니다! 예산과 일정을 초과해요."}'
WHERE ticket_key = 'PLAN_INFRA_001';

UPDATE public.tickets SET narratives = '{"critical":"CI/CD 파이프라인이 완벽하게 설계됐습니다! 자동화 덕분에 배포가 쉬워질 것입니다. 대성공!","success":"CI/CD 파이프라인 설계를 완료하고 도구를 선정했습니다.","fail":"파이프라인 설계에 빈틈이 있어 수동 작업이 남아있습니다.","fumble":"CI/CD 설계가 현실과 맞지 않습니다! 처음부터 다시 설계해야 해요."}'
WHERE ticket_key = 'PLAN_INFRA_002';

UPDATE public.tickets SET narratives = '{"critical":"모니터링 전략이 완벽합니다! 모든 지표가 실시간으로 감지됩니다. 대성공!","success":"모니터링 지표와 알림 임계값을 정의했습니다.","fail":"일부 핵심 지표가 모니터링 계획에서 누락됐습니다.","fumble":"모니터링 전략이 너무 복잡합니다! 오히려 알림 피로가 생길 것 같아요."}'
WHERE ticket_key = 'PLAN_INFRA_003';

UPDATE public.tickets SET narratives = '{"critical":"보안 체크리스트가 완벽합니다! 취약점을 미리 모두 잡았어요. 대성공!","success":"보안 정책 체크리스트를 완성하고 팀에 배포했습니다.","fail":"몇 가지 보안 항목이 누락됐습니다. 추가 검토가 필요합니다.","fumble":"보안 정책 체크리스트에 심각한 허점이 있습니다! 즉시 보완이 필요해요."}'
WHERE ticket_key = 'PLAN_INFRA_004';

UPDATE public.tickets SET narratives = '{"critical":"인프라 비용 구조를 완벽하게 분석했습니다! 예산을 30% 절감할 수 있는 계획이에요. 대성공!","success":"인프라 비용을 추정하고 최적화 방향을 수립했습니다.","fail":"비용 추정이 부정확해 예산 계획을 수정해야 합니다.","fumble":"인프라 비용 계획이 현실과 동떨어졌습니다! 예산이 크게 부족할 것 같아요."}'
WHERE ticket_key = 'PLAN_INFRA_005';

UPDATE public.tickets SET narratives = '{"critical":"DR 계획이 완벽합니다! RTO/RPO 목표를 모두 충족하는 설계예요. 대성공!","success":"백업 주기와 재해복구 절차를 문서화했습니다.","fail":"DR 계획이 일부 시나리오를 커버하지 못합니다.","fumble":"DR 계획에 심각한 결함이 발견됐습니다! 실제 장애 시 복구가 불가능할 수 있어요."}'
WHERE ticket_key = 'PLAN_INFRA_006';

-- ============================================================
-- PHASE: PLAN — QA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"테스트 전략이 완벽합니다! 단위·통합·E2E 레벨이 명확하게 분리됐어요. 대성공!","success":"테스트 전략 문서를 완성하고 팀의 승인을 받았습니다.","fail":"테스트 전략이 너무 이상적입니다. 현실적인 조정이 필요해요.","fumble":"테스트 전략이 실행 불가능합니다! 시간과 리소스가 턱없이 부족해요."}'
WHERE ticket_key = 'PLAN_QA_001';

UPDATE public.tickets SET narratives = '{"critical":"품질 게이트 기준이 완벽합니다! 릴리즈 품질이 보장될 것입니다. 대성공!","success":"커버리지와 성능 임계값 등 품질 게이트를 정의했습니다.","fail":"품질 게이트 기준이 너무 엄격하거나 느슨해 조정이 필요합니다.","fumble":"품질 게이트 기준에 팀 내 합의가 이루어지지 않았습니다!"}'
WHERE ticket_key = 'PLAN_QA_002';

UPDATE public.tickets SET narratives = '{"critical":"테스트 환경 계획이 완벽합니다! 데이터 격리와 픽스처 관리가 체계적이에요. 대성공!","success":"테스트 환경 설정과 시드 데이터 관리 계획을 완성했습니다.","fail":"테스트 데이터 관리 계획이 불완전합니다. 환경 오염 위험이 있어요.","fumble":"테스트 환경 계획이 실행 불가능합니다! 인프라 비용이 너무 높아요."}'
WHERE ticket_key = 'PLAN_QA_003';

UPDATE public.tickets SET narratives = '{"critical":"탐색적 테스트 시나리오가 완벽합니다! 숨겨진 버그를 모두 잡을 수 있을 것 같아요. 대성공!","success":"탐색적 테스트 범위와 방법론을 체계적으로 계획했습니다.","fail":"탐색적 테스트 계획이 너무 광범위해 실행이 어렵습니다.","fumble":"탐색적 테스트 계획이 아무 방향도 없습니다! 무작위 테스트와 다를 게 없어요."}'
WHERE ticket_key = 'PLAN_QA_004';

UPDATE public.tickets SET narratives = '{"critical":"성능 기준선이 완벽합니다! 목표 지표가 명확하고 측정 가능해요. 대성공!","success":"성능 테스트 기준선을 설정하고 임계값을 정의했습니다.","fail":"성능 기준선이 현실과 맞지 않아 수정이 필요합니다.","fumble":"성능 테스트 기준선이 너무 낮게 설정됐습니다! 실제 사용자 경험을 반영하지 못해요."}'
WHERE ticket_key = 'PLAN_QA_005';

UPDATE public.tickets SET narratives = '{"critical":"보안 테스트 체크리스트가 완벽합니다! OWASP Top 10을 모두 커버해요. 대성공!","success":"보안 테스트 항목을 정리하고 우선순위를 정했습니다.","fail":"보안 테스트 항목이 누락돼 취약점을 놓칠 수 있습니다.","fumble":"보안 테스트 체크리스트가 너무 형식적입니다! 실질적인 보안 개선이 없어요."}'
WHERE ticket_key = 'PLAN_QA_006';

-- ============================================================
-- PHASE: IMPLEMENT — FE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"런 대시보드가 완벽하게 구현됐습니다! 상태 정보가 직관적으로 보여요. 대성공!","success":"런 대시보드 UI를 성공적으로 구현하고 데이터를 연결했습니다.","fail":"UI 레이아웃이 불안정해 추가 수정이 필요합니다.","fumble":"대시보드가 데이터를 잘못 표시합니다! 심각한 렌더링 버그가 발생했어요."}'
WHERE ticket_key = 'IMPL_FE_001';

UPDATE public.tickets SET narratives = '{"critical":"티켓 선택 UX가 완벽합니다! 카드 애니메이션도 매끄럽게 작동해요. 대성공!","success":"티켓 선택 인터랙션을 구현하고 퀵 모드도 완성했습니다.","fail":"일부 인터랙션이 버벅입니다. 성능 최적화가 필요해요.","fumble":"티켓 선택이 작동하지 않습니다! 상태 관리 버그로 선택이 무시돼요."}'
WHERE ticket_key = 'IMPL_FE_002';

UPDATE public.tickets SET narratives = '{"critical":"초기 로딩이 획기적으로 빨라졌습니다! FCP가 0.8초로 줄었어요. 대성공!","success":"SSR에서 런 데이터를 효율적으로 프리페치하도록 최적화했습니다.","fail":"일부 페이지에서 SSR 데이터가 hydration 불일치를 일으킵니다.","fumble":"SSR 최적화로 오히려 더 느려졌습니다! 캐시 전략이 완전히 잘못됐어요."}'
WHERE ticket_key = 'IMPL_FE_003';

UPDATE public.tickets SET narratives = '{"critical":"이벤트 모달이 완벽합니다! 선택지와 확률 정보가 한눈에 보여요. 대성공!","success":"이벤트 팝업 모달을 구현하고 애니메이션도 부드럽게 완성했습니다.","fail":"모달 접근성이 부족해 키보드 트랩 처리가 필요합니다.","fumble":"이벤트 모달이 다른 UI 요소를 가립니다! 오버레이 z-index 충돌이 발생했어요."}'
WHERE ticket_key = 'IMPL_FE_004';

UPDATE public.tickets SET narratives = '{"critical":"인벤토리 UI가 완벽합니다! 아이템 필터링과 정렬도 매끄러워요. 대성공!","success":"인벤토리와 아티팩트 장착 UI를 완성했습니다.","fail":"아이템 목록이 많아지면 렌더링이 느립니다. 가상화가 필요해요.","fumble":"인벤토리 데이터가 동기화되지 않습니다! 장착 상태가 틀리게 표시돼요."}'
WHERE ticket_key = 'IMPL_FE_005';

UPDATE public.tickets SET narratives = '{"critical":"레이드 HUD가 완벽합니다! 실시간 KPI가 생생하게 업데이트돼요. 대성공!","success":"실시간 레이드 HUD를 구현하고 Realtime 채널과 연결했습니다.","fail":"HUD 업데이트가 간헐적으로 지연됩니다. Realtime 연결 최적화가 필요해요.","fumble":"레이드 HUD가 메모리 누수를 일으킵니다! 컴포넌트 정리가 안 되고 있어요."}'
WHERE ticket_key = 'IMPL_FE_006';

-- ============================================================
-- PHASE: IMPLEMENT — BE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"draw_ticket RPC가 완벽합니다! 시드 기반 RNG가 완전히 재현 가능해요. 대성공!","success":"draw_ticket RPC 함수를 구현하고 RLS 정책을 적용했습니다.","fail":"드로우 시 간헐적으로 중복 티켓이 나옵니다. 로직 수정이 필요해요.","fumble":"draw_ticket에 치명적인 버그가 있습니다! 같은 티켓만 반복해서 나와요."}'
WHERE ticket_key = 'IMPL_BE_001';

UPDATE public.tickets SET narratives = '{"critical":"멱등성 처리가 완벽합니다! 네트워크 재시도에서도 안전해요. 대성공!","success":"idempotency_key 기반의 중복 실행 방지 로직을 구현했습니다.","fail":"일부 엣지 케이스에서 중복 처리가 발생합니다. 추가 검증이 필요해요.","fumble":"멱등성 구현에 버그가 있습니다! 동시 요청 시 데이터가 두 번 저장돼요."}'
WHERE ticket_key = 'IMPL_BE_002';

UPDATE public.tickets SET narratives = '{"critical":"레이드 액션 처리가 완벽합니다! KPI 연산도 정확하고 빠르네요. 대성공!","success":"레이드 액션 Edge Function을 구현하고 KPI 연산을 연동했습니다.","fail":"레이드 액션 롤 계산에 불일치가 있습니다. 검증이 필요해요.","fumble":"레이드 액션 함수가 경쟁 조건을 일으킵니다! 동시 액션 시 KPI가 잘못 계산돼요."}'
WHERE ticket_key = 'IMPL_BE_003';

UPDATE public.tickets SET narratives = '{"critical":"쿼리가 10배 빨라졌습니다! 인덱스 설계가 완벽해요. 대성공!","success":"런 히스토리 조회 쿼리를 최적화하고 인덱스를 추가했습니다.","fail":"일부 복잡한 쿼리는 여전히 느립니다. 추가 최적화가 필요해요.","fumble":"쿼리 최적화가 오히려 다른 쿼리를 느리게 만들었습니다! 인덱스 충돌이에요."}'
WHERE ticket_key = 'IMPL_BE_004';

UPDATE public.tickets SET narratives = '{"critical":"실시간 채널이 완벽합니다! 지연 없이 모든 이벤트가 전파돼요. 대성공!","success":"Supabase Realtime 채널을 구현하고 레이드 이벤트를 브로드캐스트합니다.","fail":"채널 재연결 로직이 불완전합니다. 네트워크 불안정 시 메시지가 유실돼요.","fumble":"Realtime 채널이 연결 폭풍을 일으킵니다! 다수 동시 연결 시 서버가 과부하돼요."}'
WHERE ticket_key = 'IMPL_BE_005';

UPDATE public.tickets SET narratives = '{"critical":"배치 집계가 완벽합니다! 수백만 건도 빠르게 처리해요. 대성공!","success":"런 통계 집계 배치 함수를 구현하고 스케줄링을 설정했습니다.","fail":"대용량 데이터에서 타임아웃이 발생합니다. 청크 처리가 필요해요.","fumble":"배치 함수가 잘못된 통계를 생성합니다! 집계 로직에 심각한 오류가 있어요."}'
WHERE ticket_key = 'IMPL_BE_006';

-- ============================================================
-- PHASE: IMPLEMENT — INFRA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"CI 파이프라인이 완벽합니다! 빌드부터 테스트까지 5분 안에 완료돼요. 대성공!","success":"GitHub Actions CI 파이프라인을 구현하고 자동화를 완성했습니다.","fail":"일부 테스트 단계가 간헐적으로 실패합니다. 플리키 테스트 처리가 필요해요.","fumble":"CI 파이프라인이 프로덕션 시크릿을 로그에 노출시켰습니다! 즉시 키 교체가 필요해요."}'
WHERE ticket_key = 'IMPL_INFRA_001';

UPDATE public.tickets SET narratives = '{"critical":"마이그레이션 자동화가 완벽합니다! 롤백도 안전하게 처리돼요. 대성공!","success":"Supabase 마이그레이션을 CI/CD에 통합하고 자동화했습니다.","fail":"마이그레이션 순서 충돌이 발생합니다. 의존성 관리가 필요해요.","fumble":"자동 마이그레이션이 스테이징 DB를 초기화했습니다! 데이터가 날아갔어요."}'
WHERE ticket_key = 'IMPL_INFRA_002';

UPDATE public.tickets SET narratives = '{"critical":"Sentry 연동이 완벽합니다! 에러 컨텍스트가 상세하게 수집돼요. 대성공!","success":"Sentry를 연동하고 에러 알림과 성능 모니터링을 설정했습니다.","fail":"일부 에러가 Sentry에 전달되지 않습니다. 설정 수정이 필요해요.","fumble":"Sentry가 민감한 사용자 데이터를 수집하고 있습니다! 즉시 필터링이 필요해요."}'
WHERE ticket_key = 'IMPL_INFRA_003';

UPDATE public.tickets SET narratives = '{"critical":"시크릿 관리 체계가 완벽합니다! 환경별 격리가 빈틈없어요. 대성공!","success":"환경 변수와 시크릿 관리 체계를 구축하고 팀에 가이드를 배포했습니다.","fail":"일부 시크릿이 .env 파일로 관리되고 있습니다. 보안 개선이 필요해요.","fumble":"시크릿이 git 이력에 커밋됐습니다! 즉시 키를 교체해야 해요."}'
WHERE ticket_key = 'IMPL_INFRA_004';

UPDATE public.tickets SET narratives = '{"critical":"CDN 캐싱이 완벽합니다! 정적 자산 로딩이 95% 빨라졌어요. 대성공!","success":"CDN 캐싱 정책을 구성하고 캐시 히트율을 높였습니다.","fail":"캐시 무효화가 제대로 동작하지 않아 오래된 데이터가 노출됩니다.","fumble":"CDN 설정 실수로 모든 요청이 오리진 서버에 전달됩니다! 서버 과부하가 발생했어요."}'
WHERE ticket_key = 'IMPL_INFRA_005';

UPDATE public.tickets SET narratives = '{"critical":"RLS 정책이 완벽합니다! 모든 데이터 접근이 안전하게 제어돼요. 대성공!","success":"RLS 정책을 전체 테이블에 적용하고 권한 최소화를 완료했습니다.","fail":"일부 RLS 정책이 과도하게 제한적입니다. 쿼리 오류가 발생할 수 있어요.","fumble":"RLS 정책 오류로 다른 사용자의 데이터가 노출됩니다! 즉시 수정이 필요해요."}'
WHERE ticket_key = 'IMPL_INFRA_006';

-- ============================================================
-- PHASE: IMPLEMENT — QA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"단위 테스트 커버리지 95% 달성! 모든 엣지 케이스를 잡았어요. 대성공!","success":"게임 로직 함수의 단위 테스트를 작성하고 커버리지를 높였습니다.","fail":"테스트 커버리지가 목표에 미달합니다. 추가 케이스 작성이 필요해요.","fumble":"단위 테스트가 실제 버그를 놓쳤습니다! 테스트 설계 자체에 문제가 있어요."}'
WHERE ticket_key = 'IMPL_QA_001';

UPDATE public.tickets SET narratives = '{"critical":"RPC 통합 테스트가 완벽합니다! 모든 시나리오를 커버해요. 대성공!","success":"RPC 함수의 통합 테스트를 작성하고 정확도를 검증했습니다.","fail":"일부 RPC 함수의 에러 케이스가 테스트에서 빠졌습니다.","fumble":"통합 테스트가 실제 DB를 수정했습니다! 데이터가 오염됐어요."}'
WHERE ticket_key = 'IMPL_QA_002';

UPDATE public.tickets SET narratives = '{"critical":"E2E 테스트 스위트가 완벽합니다! 전체 플로우가 자동으로 검증돼요. 대성공!","success":"런 진행 전체 플로우의 E2E 테스트를 Playwright로 구현했습니다.","fail":"E2E 테스트가 간헐적으로 실패합니다. 타이밍 문제를 해결해야 해요.","fumble":"E2E 테스트 실행 시간이 30분을 넘습니다! CI 파이프라인이 마비됐어요."}'
WHERE ticket_key = 'IMPL_QA_003';

UPDATE public.tickets SET narratives = '{"critical":"API 계약 테스트가 완벽합니다! 스키마 변경을 즉시 감지해요. 대성공!","success":"API 계약 테스트를 구현하고 CI에 통합했습니다.","fail":"일부 API의 계약 테스트가 누락됐습니다. 변경 감지가 불완전해요.","fumble":"API 계약 테스트가 거짓 양성을 대량으로 발생시킵니다! CI가 항상 실패해요."}'
WHERE ticket_key = 'IMPL_QA_004';

UPDATE public.tickets SET narratives = '{"critical":"접근성 테스트 자동화가 완벽합니다! WCAG 위반을 즉시 감지해요. 대성공!","success":"axe-core 기반의 접근성 자동화 테스트를 구현했습니다.","fail":"자동화 테스트가 시각적 접근성 이슈를 감지하지 못합니다.","fumble":"접근성 테스트가 모든 컴포넌트에서 실패합니다! 기본 설정이 잘못됐어요."}'
WHERE ticket_key = 'IMPL_QA_005';

UPDATE public.tickets SET narratives = '{"critical":"픽스처 라이브러리가 완벽합니다! 테스트 작성이 10배 빨라졌어요. 대성공!","success":"테스트 픽스처와 팩토리 라이브러리를 구축하고 문서화했습니다.","fail":"픽스처 구조가 복잡해 새 팀원이 사용하기 어렵습니다.","fumble":"픽스처 라이브러리에 메모리 누수가 있습니다! 테스트 실행이 점점 느려져요."}'
WHERE ticket_key = 'IMPL_QA_006';

-- ============================================================
-- PHASE: TEST — FE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"시각적 회귀 테스트를 완벽하게 구축! UI 변경을 자동으로 감지해요. 대성공!","success":"런 대시보드의 시각적 회귀 테스트를 설정하고 스냅샷을 저장했습니다.","fail":"일부 컴포넌트의 스냅샷이 불안정합니다. 테스트 안정화가 필요해요.","fumble":"시각적 회귀 테스트가 잘못된 스냅샷을 기준으로 합니다! 모든 비교가 무의미해요."}'
WHERE ticket_key = 'TEST_FE_001';

UPDATE public.tickets SET narratives = '{"critical":"모든 플리키 테스트를 완전히 수정했습니다! CI가 안정적으로 통과해요. 대성공!","success":"타이밍 의존 테스트를 고정하고 CI 통과율이 안정화됐습니다.","fail":"일부 테스트는 여전히 간헐적으로 실패합니다. 근본 원인 분석이 필요해요.","fumble":"수정한 테스트가 오히려 더 불안정해졌습니다! 더 많은 케이스에서 실패해요."}'
WHERE ticket_key = 'TEST_FE_002';

UPDATE public.tickets SET narratives = '{"critical":"성능 병목을 모두 제거했습니다! 렌더링이 2배 빨라졌어요. 대성공!","success":"렌더링 성능 프로파일링을 완료하고 주요 병목 지점을 파악했습니다.","fail":"프로파일링 결과가 불명확합니다. 재측정이 필요해요.","fumble":"프로파일링 중 예상치 못한 버그가 발견됐습니다! 긴급 수정이 필요해요."}'
WHERE ticket_key = 'TEST_FE_003';

UPDATE public.tickets SET narratives = '{"critical":"모든 주요 브라우저에서 완벽하게 동작합니다! 대성공!","success":"크로스 브라우저 테스트를 완료하고 발견된 이슈를 수정했습니다.","fail":"Safari에서 일부 레이아웃 이슈가 발견됐습니다. 수정이 필요해요.","fumble":"IE 호환성 문제로 수많은 폴리필이 필요합니다! 번들 크기가 폭발했어요."}'
WHERE ticket_key = 'TEST_FE_004';

UPDATE public.tickets SET narratives = '{"critical":"네트워크 불안정 상황에서도 완벽하게 동작합니다! 대성공!","success":"오프라인 시나리오 테스트를 완료하고 에러 처리를 개선했습니다.","fail":"오프라인 중 사용자 데이터가 유실됩니다. 로컬 캐싱이 필요해요.","fumble":"네트워크 복구 후 상태가 일관되지 않습니다! 데이터가 뒤섞여요."}'
WHERE ticket_key = 'TEST_FE_005';

UPDATE public.tickets SET narratives = '{"critical":"다크모드가 완벽합니다! 모든 컴포넌트에서 색 대비가 기준을 충족해요. 대성공!","success":"다크모드와 테마 전환 테스트를 완료하고 이슈를 수정했습니다.","fail":"일부 컴포넌트가 다크모드에서 색 대비 기준을 충족하지 못합니다.","fumble":"테마 전환 중 플래시 현상이 발생합니다! 사용자 경험이 나빠요."}'
WHERE ticket_key = 'TEST_FE_006';

-- ============================================================
-- PHASE: TEST — BE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"상태 머신 경계값 테스트가 완벽합니다! 모든 엣지 케이스를 잡았어요. 대성공!","success":"런 상태 머신의 경계값 테스트를 완료하고 로직 오류를 수정했습니다.","fail":"일부 경계값 케이스에서 예상과 다른 동작이 발견됐습니다.","fumble":"상태 머신 버그가 데이터를 손상시킵니다! 프로덕션 이전에 반드시 수정해야 해요."}'
WHERE ticket_key = 'TEST_BE_001';

UPDATE public.tickets SET narratives = '{"critical":"RLS 정책이 완벽합니다! 모든 침투 테스트 시도가 차단됐어요. 대성공!","success":"RLS 침투 테스트를 완료하고 권한 허점을 수정했습니다.","fail":"일부 RLS 정책에 경미한 허점이 발견됐습니다. 즉시 수정이 필요해요.","fumble":"심각한 권한 취약점이 발견됐습니다! 다른 사용자의 데이터에 접근 가능해요."}'
WHERE ticket_key = 'TEST_BE_002';

UPDATE public.tickets SET narratives = '{"critical":"KPI 음수 버그를 완전히 수정하고 재현 테스트도 완성했습니다! 대성공!","success":"레이드 KPI 음수 버그를 재현하고 근본 원인을 파악했습니다.","fail":"버그가 재현되지 않습니다. 환경 의존적인 문제일 수 있어요.","fumble":"버그 수정이 또 다른 버그를 유발했습니다! 연쇄 오류가 발생해요."}'
WHERE ticket_key = 'TEST_BE_003';

UPDATE public.tickets SET narratives = '{"critical":"고부하 환경에서도 멱등성이 완벽하게 보장됩니다! 대성공!","success":"멱등성 스트레스 테스트를 완료하고 중복 처리 문제를 검증했습니다.","fail":"높은 동시성에서 간헐적인 중복 처리가 발생합니다.","fumble":"스트레스 테스트 중 데이터베이스가 과부하로 다운됐습니다!"}'
WHERE ticket_key = 'TEST_BE_004';

UPDATE public.tickets SET narratives = '{"critical":"콜드 스타트가 200ms 이하로 최적화됐습니다! 사용자가 지연을 느끼지 못해요. 대성공!","success":"Edge Function 콜드 스타트 시간을 측정하고 최적화 방향을 파악했습니다.","fail":"콜드 스타트가 여전히 1초 이상입니다. 초기화 로직 최적화가 필요해요.","fumble":"콜드 스타트 최적화 시도가 오히려 핫 성능을 저하시켰습니다!"}'
WHERE ticket_key = 'TEST_BE_005';

UPDATE public.tickets SET narratives = '{"critical":"마이그레이션 검증이 완벽합니다! 데이터 무결성이 100% 보장돼요. 대성공!","success":"데이터 마이그레이션 검증 테스트를 완료하고 정합성을 확인했습니다.","fail":"일부 데이터 변환에서 정합성 오류가 발견됐습니다.","fumble":"마이그레이션 검증 중 데이터 손실이 발견됐습니다! 즉시 롤백해야 해요."}'
WHERE ticket_key = 'TEST_BE_006';

-- ============================================================
-- PHASE: TEST — INFRA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"API가 예상 부하의 3배를 견딥니다! 스케일링 여유가 충분해요. 대성공!","success":"API 부하 테스트를 완료하고 병목 지점을 파악했습니다.","fail":"동시 접속 200명에서 응답 시간이 크게 늘어납니다.","fumble":"부하 테스트 중 프로덕션 DB에 잘못 연결됐습니다! 실제 데이터가 오염됐어요."}'
WHERE ticket_key = 'TEST_INFRA_001';

UPDATE public.tickets SET narratives = '{"critical":"CI 실행 시간이 절반으로 줄었습니다! 개발 속도가 크게 향상됐어요. 대성공!","success":"CI 파이프라인 실행 시간을 최적화하고 캐싱을 개선했습니다.","fail":"일부 테스트 단계는 여전히 시간이 오래 걸립니다.","fumble":"캐싱 최적화로 인해 오래된 의존성이 사용됩니다! 빌드 오류가 발생했어요."}'
WHERE ticket_key = 'TEST_INFRA_002';

UPDATE public.tickets SET narratives = '{"critical":"15분 만에 완전 복구 성공! RTO 목표를 초과 달성했어요. 대성공!","success":"DB 백업 복구 드릴을 실행하고 RTO/RPO 목표 달성을 확인했습니다.","fail":"복구 시간이 목표 RTO를 초과했습니다. 절차 개선이 필요해요.","fumble":"복구 드릴 중 백업 파일이 손상됐습니다! 실제 장애 시 복구 불가능해요."}'
WHERE ticket_key = 'TEST_INFRA_003';

UPDATE public.tickets SET narratives = '{"critical":"의존성 취약점이 하나도 발견되지 않았습니다! 완벽한 보안 상태예요. 대성공!","success":"의존성 취약점 검사를 완료하고 발견된 취약점을 패치했습니다.","fail":"중간 심각도 취약점이 여러 개 발견됐습니다. 패치 일정을 잡아야 해요.","fumble":"심각한 CVE 취약점이 발견됐습니다! 즉시 핫픽스 배포가 필요해요."}'
WHERE ticket_key = 'TEST_INFRA_004';

UPDATE public.tickets SET narratives = '{"critical":"구성 드리프트가 완벽하게 감지됩니다! IaC 상태가 실제와 일치해요. 대성공!","success":"인프라 구성 드리프트 감지 테스트를 완료하고 불일치를 수정했습니다.","fail":"일부 인프라 구성이 코드와 맞지 않습니다. 동기화가 필요해요.","fumble":"드리프트 수정 중 프로덕션 설정이 실수로 변경됐습니다! 장애가 발생했어요."}'
WHERE ticket_key = 'TEST_INFRA_005';

UPDATE public.tickets SET narratives = '{"critical":"재해복구 시뮬레이션이 완벽합니다! 모든 시나리오에서 목표를 달성했어요. 대성공!","success":"재해복구 시나리오 시뮬레이션을 완료하고 취약 지점을 보완했습니다.","fail":"일부 시나리오에서 복구 절차가 불완전합니다. 보완이 필요해요.","fumble":"시뮬레이션이 실제 장애를 유발했습니다! 운영 중인 서비스가 중단됐어요."}'
WHERE ticket_key = 'TEST_INFRA_006';

-- ============================================================
-- PHASE: TEST — QA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"전체 게임 플로우 E2E 테스트가 완벽합니다! 회귀 버그를 모두 잡았어요. 대성공!","success":"전체 게임 플로우 회귀 테스트를 완료하고 발견된 버그를 수정했습니다.","fail":"몇 가지 회귀 버그가 발견됐습니다. 수정 후 재검증이 필요해요.","fumble":"E2E 테스트 실행 중 데이터 오염이 발생했습니다! 테스트 격리가 필요해요."}'
WHERE ticket_key = 'TEST_QA_001';

UPDATE public.tickets SET narratives = '{"critical":"4인 레이드 모든 시나리오 통과! 동기화가 완벽해요. 대성공!","success":"레이드 멀티플레이어 시나리오 테스트를 완료하고 동기화 이슈를 수정했습니다.","fail":"4인 동시 액션 시 일부 순서 충돌이 발생합니다.","fumble":"레이드 중 일부 플레이어의 액션이 유실됩니다! 심각한 동기화 버그예요."}'
WHERE ticket_key = 'TEST_QA_002';

UPDATE public.tickets SET narratives = '{"critical":"경제 시스템의 모든 허점을 발견했습니다! 밸런스도 완벽해요. 대성공!","success":"경제 시스템 탐색적 테스트를 완료하고 밸런스 이슈를 보고했습니다.","fail":"일부 크레딧 획득 경로에서 밸런스 문제가 발견됐습니다.","fumble":"치명적인 크레딧 복제 버그가 발견됐습니다! 경제 시스템이 무너질 수 있어요."}'
WHERE ticket_key = 'TEST_QA_003';

UPDATE public.tickets SET narratives = '{"critical":"PvP 공정성이 완벽하게 검증됐습니다! 모든 포지션이 균형잡혀 있어요. 대성공!","success":"PvP 공정성 테스트를 완료하고 불균형 요소를 수정했습니다.","fail":"일부 포지션 조합에서 밸런스 불균형이 발견됐습니다.","fumble":"PvP 판정 로직에 심각한 버그가 있습니다! 특정 캐릭터가 항상 이겨요."}'
WHERE ticket_key = 'TEST_QA_004';

UPDATE public.tickets SET narratives = '{"critical":"성능 회귀 테스트 자동화 완성! 빌드마다 성능 지표가 검증돼요. 대성공!","success":"성능 회귀 테스트를 구현하고 CI에 통합했습니다.","fail":"성능 임계값 설정이 너무 엄격해 거짓 실패가 자주 발생합니다.","fumble":"성능 회귀 테스트가 메모리를 과도하게 사용합니다! CI 서버가 OOM으로 다운됐어요."}'
WHERE ticket_key = 'TEST_QA_005';

UPDATE public.tickets SET narratives = '{"critical":"버그 재현 환경 자동화가 완벽합니다! 신고된 버그를 즉시 재현할 수 있어요. 대성공!","success":"버그 재현 환경 자동화를 구축하고 티켓 시스템과 연동했습니다.","fail":"일부 버그가 환경 차이로 인해 재현되지 않습니다.","fumble":"자동화 스크립트가 프로덕션 DB를 참조합니다! 실제 데이터에 접근됐어요."}'
WHERE ticket_key = 'TEST_QA_006';

-- ============================================================
-- PHASE: DEPLOY — FE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"카나리 배포가 완벽합니다! 1% 트래픽으로 이슈를 조기에 감지해요. 대성공!","success":"Vercel 카나리 배포를 설정하고 트래픽 분할을 구성했습니다.","fail":"카나리 배포 설정이 일부 환경에서 제대로 동작하지 않습니다.","fumble":"카나리 설정 실수로 100% 트래픽이 새 버전으로 몰렸습니다! 즉시 롤백이 필요해요."}'
WHERE ticket_key = 'DEPLOY_FE_001';

UPDATE public.tickets SET narratives = '{"critical":"피처 플래그 시스템이 완벽합니다! 기능을 세밀하게 제어할 수 있어요. 대성공!","success":"피처 플래그 시스템을 적용하고 주요 기능에 플래그를 추가했습니다.","fail":"피처 플래그 로직이 복잡해져 유지보수가 어렵습니다.","fumble":"피처 플래그 오류로 모든 사용자에게 미완성 기능이 노출됐습니다!"}'
WHERE ticket_key = 'DEPLOY_FE_002';

UPDATE public.tickets SET narratives = '{"critical":"번들 크기를 40% 줄였습니다! 초기 로딩이 눈에 띄게 빨라졌어요. 대성공!","success":"프론트엔드 번들을 최적화하고 코드 스플리팅을 개선했습니다.","fail":"일부 동적 임포트가 예상보다 큰 청크를 생성합니다.","fumble":"번들 최적화가 일부 기능을 깨뜨렸습니다! 트리 쉐이킹이 잘못됐어요."}'
WHERE ticket_key = 'DEPLOY_FE_003';

UPDATE public.tickets SET narratives = '{"critical":"블루-그린 전환이 완벽합니다! 0초 다운타임으로 배포가 완료됐어요. 대성공!","success":"블루-그린 배포 전환을 검증하고 롤백 절차를 확인했습니다.","fail":"전환 중 5초간 503 에러가 발생했습니다. 헬스체크 튜닝이 필요해요.","fumble":"블루-그린 전환 실패로 두 버전이 동시에 실행됩니다! 데이터 불일치가 발생했어요."}'
WHERE ticket_key = 'DEPLOY_FE_004';

UPDATE public.tickets SET narratives = '{"critical":"캐시 무효화 전략이 완벽합니다! 배포 즉시 새 버전이 반영돼요. 대성공!","success":"정적 자산 캐시 무효화 전략을 적용하고 CDN 설정을 업데이트했습니다.","fail":"일부 사용자에게 오래된 자산이 캐시됩니다. TTL 조정이 필요해요.","fumble":"설정 실수로 모든 CDN 캐시가 무효화됐습니다! 원본 서버 부하가 폭증했어요."}'
WHERE ticket_key = 'DEPLOY_FE_005';

UPDATE public.tickets SET narratives = '{"critical":"스모크 테스트 자동화가 완벽합니다! 배포 5분 만에 이상 여부를 감지해요. 대성공!","success":"배포 후 스모크 테스트를 자동화하고 알림을 설정했습니다.","fail":"일부 중요 기능이 스모크 테스트 범위에서 빠졌습니다.","fumble":"스모크 테스트가 통과됐지만 실제 사용자 버그가 있었습니다! 테스트가 너무 얕아요."}'
WHERE ticket_key = 'DEPLOY_FE_006';

-- ============================================================
-- PHASE: DEPLOY — BE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"무중단 마이그레이션이 완벽합니다! 사용자가 전혀 영향을 받지 않았어요. 대성공!","success":"DB 마이그레이션 무중단 배포 절차를 수립하고 검증했습니다.","fail":"마이그레이션 중 일부 쿼리 성능이 저하됩니다. 인덱스 생성 순서를 조정해야 해요.","fumble":"마이그레이션 중 데이터베이스 잠금으로 1분간 서비스가 중단됐습니다!"}'
WHERE ticket_key = 'DEPLOY_BE_001';

UPDATE public.tickets SET narratives = '{"critical":"Edge Function 배포 파이프라인이 완벽합니다! 버전 추적도 완전해요. 대성공!","success":"Edge Function을 배포하고 버전 관리 체계를 구축했습니다.","fail":"일부 Function의 배포가 실패합니다. 환경 변수 설정을 확인해야 해요.","fumble":"잘못된 Function이 배포됐습니다! 게임 로직 오류로 런이 정상 작동하지 않아요."}'
WHERE ticket_key = 'DEPLOY_BE_002';

UPDATE public.tickets SET narratives = '{"critical":"롤백 플랜이 완벽합니다! 5분 안에 이전 버전으로 복구할 수 있어요. 대성공!","success":"롤백 플랜을 수립하고 실제 롤백 절차를 검증했습니다.","fail":"롤백 절차가 일부 시나리오에서 작동하지 않습니다.","fumble":"롤백 중 데이터 불일치가 발생했습니다! DB와 코드 버전이 맞지 않아요."}'
WHERE ticket_key = 'DEPLOY_BE_003';

UPDATE public.tickets SET narratives = '{"critical":"환경 설정이 완벽합니다! 불필요한 설정과 보안 위험이 모두 제거됐어요. 대성공!","success":"환경 설정 감사를 완료하고 불필요한 설정을 정리했습니다.","fail":"일부 환경 변수가 프로덕션과 스테이징에서 다르게 설정됩니다.","fumble":"감사 중 민감한 시크릿이 설정에 평문으로 저장됐음을 발견했습니다!"}'
WHERE ticket_key = 'DEPLOY_BE_004';

UPDATE public.tickets SET narratives = '{"critical":"DB 성능이 2배 향상됐습니다! 느린 쿼리가 모두 사라졌어요. 대성공!","success":"DB 성능 튜닝 변경사항을 배포하고 쿼리 성능을 검증했습니다.","fail":"튜닝 후 일부 쿼리가 예상과 다르게 작동합니다.","fumble":"성능 튜닝이 데이터 정합성 문제를 일으켰습니다! 즉시 롤백이 필요해요."}'
WHERE ticket_key = 'DEPLOY_BE_005';

UPDATE public.tickets SET narratives = '{"critical":"Rate Limiting이 완벽하게 배포됐습니다! DDoS 방어도 가능해요. 대성공!","success":"API Rate Limiting을 배포하고 임계값을 설정했습니다.","fail":"일부 합법적인 API 호출이 Rate Limit에 걸립니다. 임계값 조정이 필요해요.","fumble":"Rate Limiting 설정 오류로 모든 API 요청이 차단됐습니다! 서비스가 완전히 중단됐어요."}'
WHERE ticket_key = 'DEPLOY_BE_006';

-- ============================================================
-- PHASE: DEPLOY — INFRA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"프로덕션 롤아웃이 완전 자동화됐습니다! 버튼 하나로 배포가 완료돼요. 대성공!","success":"프로덕션 인프라 롤아웃 자동화를 완성하고 검증했습니다.","fail":"일부 롤아웃 단계가 수동 개입을 필요로 합니다.","fumble":"자동화 스크립트 오류로 프로덕션 인프라 설정이 잘못 변경됐습니다!"}'
WHERE ticket_key = 'DEPLOY_INFRA_001';

UPDATE public.tickets SET narratives = '{"critical":"로그 파이프라인이 완벽합니다! 실시간으로 모든 이벤트가 집계돼요. 대성공!","success":"로그 집계 파이프라인을 구축하고 대시보드를 설정했습니다.","fail":"로그 수집에 지연이 발생합니다. 버퍼링 설정 조정이 필요해요.","fumble":"로그 파이프라인이 PII 데이터를 수집합니다! 즉시 마스킹 처리가 필요해요."}'
WHERE ticket_key = 'DEPLOY_INFRA_002';

UPDATE public.tickets SET narratives = '{"critical":"헬스체크가 완벽합니다! 모든 의존성 상태를 실시간으로 확인할 수 있어요. 대성공!","success":"헬스체크 엔드포인트를 배포하고 모니터링 시스템과 연동했습니다.","fail":"헬스체크가 DB 연결 상태를 정확하게 반영하지 못합니다.","fumble":"헬스체크 엔드포인트가 내부 시스템 정보를 외부에 노출합니다! 보안 위험이에요."}'
WHERE ticket_key = 'DEPLOY_INFRA_003';

UPDATE public.tickets SET narratives = '{"critical":"CDN 엣지 캐싱이 완벽합니다! 글로벌 응답 속도가 50% 빨라졌어요. 대성공!","success":"CDN 엣지 캐싱 규칙을 프로덕션에 적용하고 성능을 검증했습니다.","fail":"일부 동적 콘텐츠가 잘못 캐싱됩니다. 캐시 헤더 수정이 필요해요.","fumble":"CDN 설정 실수로 인증된 데이터가 다른 사용자에게 노출됐습니다!"}'
WHERE ticket_key = 'DEPLOY_INFRA_004';

UPDATE public.tickets SET narratives = '{"critical":"Connection Pooler 설정이 완벽합니다! DB 연결 수가 80% 줄었어요. 대성공!","success":"Supabase Connection Pooler를 프로덕션에 설정하고 최적화했습니다.","fail":"Connection Pooler 설정 후 일부 쿼리에서 타임아웃이 발생합니다.","fumble":"Connection Pooler 설정 오류로 모든 DB 연결이 거부됩니다! 서비스가 중단됐어요."}'
WHERE ticket_key = 'DEPLOY_INFRA_005';

UPDATE public.tickets SET narratives = '{"critical":"배포 알림 자동화가 완벽합니다! 모든 변경이 실시간으로 추적돼요. 대성공!","success":"배포 알림과 변경 이력 자동화를 완성하고 팀 채널과 연동했습니다.","fail":"일부 배포 알림이 누락됩니다. 웹훅 설정 수정이 필요해요.","fumble":"배포 알림이 스팸으로 분류됩니다! 중요 알림이 놓칠 수 있어요."}'
WHERE ticket_key = 'DEPLOY_INFRA_006';

-- ============================================================
-- PHASE: DEPLOY — QA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"Staging 검증 게이트가 완벽합니다! 모든 품질 기준이 자동으로 확인돼요. 대성공!","success":"Staging 배포 전 검증 게이트를 구축하고 자동화했습니다.","fail":"검증 게이트 일부 항목이 자동화되지 않아 수동 확인이 필요합니다.","fumble":"검증 게이트가 결함이 있는 빌드를 통과시켰습니다! 프로덕션에 버그가 배포됐어요."}'
WHERE ticket_key = 'DEPLOY_QA_001';

UPDATE public.tickets SET narratives = '{"critical":"카나리 모니터링이 완벽합니다! 이상 징후를 즉시 감지하고 자동 롤백해요. 대성공!","success":"카나리 배포 모니터링을 설정하고 지표 이상을 체크합니다.","fail":"카나리 지표 분석이 충분하지 않아 이상 여부 판단이 어렵습니다.","fumble":"카나리 모니터링이 심각한 이상을 감지하지 못했습니다! 버그가 전체 배포됐어요."}'
WHERE ticket_key = 'DEPLOY_QA_002';

UPDATE public.tickets SET narratives = '{"critical":"프로덕션 스모크 테스트가 완벽합니다! 모든 핵심 기능이 정상 동작해요. 대성공!","success":"배포 후 프로덕션 스모크 테스트를 완료하고 서비스 정상 동작을 확인했습니다.","fail":"스모크 테스트 중 일부 기능에서 경미한 이슈가 발견됐습니다.","fumble":"스모크 테스트 실패! 핵심 기능이 작동하지 않아 즉시 롤백이 필요해요."}'
WHERE ticket_key = 'DEPLOY_QA_003';

UPDATE public.tickets SET narratives = '{"critical":"롤백 시나리오가 완벽합니다! 어떤 상황에서도 빠르게 복구할 수 있어요. 대성공!","success":"롤백 시나리오를 검증하고 절차를 문서화했습니다.","fail":"일부 롤백 시나리오에서 데이터 정합성 문제가 발생합니다.","fumble":"롤백 테스트가 프로덕션 데이터를 수정했습니다! 실제 데이터가 오염됐어요."}'
WHERE ticket_key = 'DEPLOY_QA_004';

UPDATE public.tickets SET narratives = '{"critical":"A/B 테스트 설계가 완벽합니다! 통계적으로 유의미한 결과를 얻을 수 있어요. 대성공!","success":"피처 플래그 A/B 테스트를 설계하고 측정 지표를 정의했습니다.","fail":"샘플 크기 계산이 부정확해 테스트 기간이 너무 길어집니다.","fumble":"A/B 테스트 설정이 편향됩니다! 결과를 신뢰할 수 없어요."}'
WHERE ticket_key = 'DEPLOY_QA_005';

UPDATE public.tickets SET narratives = '{"critical":"배포 체크리스트 자동화가 완벽합니다! 인적 오류가 완전히 제거됐어요. 대성공!","success":"배포 체크리스트를 자동화하고 CI/CD 파이프라인에 통합했습니다.","fail":"일부 체크리스트 항목은 자동화가 불가능해 수동 확인이 필요합니다.","fumble":"체크리스트 자동화 오류로 중요한 배포 전 검증이 건너뛰어졌습니다!"}'
WHERE ticket_key = 'DEPLOY_QA_006';

-- ============================================================
-- PHASE: OPERATE — FE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"에러 대시보드가 완벽합니다! 사용자 영향도까지 실시간으로 파악돼요. 대성공!","success":"프론트엔드 에러 추적 대시보드를 구성하고 알림을 설정했습니다.","fail":"일부 에러 유형이 대시보드에 표시되지 않습니다.","fumble":"에러 대시보드 설정 오류로 알림이 전달되지 않습니다! 심각한 에러를 놓쳤어요."}'
WHERE ticket_key = 'OPS_FE_001';

UPDATE public.tickets SET narratives = '{"critical":"Core Web Vitals가 모두 Good 범위입니다! SEO와 사용자 경험이 최상이에요. 대성공!","success":"Core Web Vitals 지속 모니터링을 설정하고 기준선을 수립했습니다.","fail":"LCP 지표가 목표를 초과합니다. 이미지 최적화가 필요해요.","fumble":"성능 지표가 급격히 악화됐습니다! 최근 배포에서 회귀가 발생한 것 같아요."}'
WHERE ticket_key = 'OPS_FE_002';

UPDATE public.tickets SET narratives = '{"critical":"핫픽스 파이프라인이 완벽합니다! 10분 만에 긴급 수정을 배포할 수 있어요. 대성공!","success":"프론트엔드 긴급 핫픽스 파이프라인을 구축하고 테스트했습니다.","fail":"핫픽스 파이프라인이 일부 검증 단계를 건너뜁니다. 안전성 개선이 필요해요.","fumble":"긴급 핫픽스가 더 큰 버그를 유발했습니다! 상황이 더 악화됐어요."}'
WHERE ticket_key = 'OPS_FE_003';

UPDATE public.tickets SET narratives = '{"critical":"사용자 행동 데이터가 완벽하게 수집됩니다! 개선 포인트가 명확하게 보여요. 대성공!","success":"사용자 행동 분석 데이터 수집 파이프라인을 구축했습니다.","fail":"이벤트 추적 누락으로 일부 사용자 흐름이 분석되지 않습니다.","fumble":"GDPR 위반! 사용자 동의 없이 민감한 데이터가 수집됐습니다."}'
WHERE ticket_key = 'OPS_FE_004';

UPDATE public.tickets SET narratives = '{"critical":"번들 크기 관리가 완벽합니다! 크기 증가를 자동으로 감지하고 알림해요. 대성공!","success":"번들 크기 지속 관리 자동화를 설정하고 임계값 알림을 구성했습니다.","fail":"번들 분석 도구가 일부 청크를 정확하게 측정하지 못합니다.","fumble":"자동화 설정 실수로 번들 크기 증가가 감지되지 않았습니다! 앱이 느려졌어요."}'
WHERE ticket_key = 'OPS_FE_005';

UPDATE public.tickets SET narratives = '{"critical":"로그 로테이션이 완벽합니다! 스토리지를 효율적으로 관리하고 있어요. 대성공!","success":"프론트엔드 로그 로테이션 정책을 적용하고 자동화했습니다.","fail":"로그 정리 정책이 일부 중요한 로그를 너무 빨리 삭제합니다.","fumble":"로그 로테이션 오류로 오래된 로그가 쌓여 디스크가 가득 찼습니다!"}'
WHERE ticket_key = 'OPS_FE_006';

-- ============================================================
-- PHASE: OPERATE — BE (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"슬로우 쿼리 감지가 완벽합니다! 성능 저하를 실시간으로 발견해요. 대성공!","success":"슬로우 쿼리 알림을 설정하고 자동 분석 파이프라인을 구축했습니다.","fail":"알림 임계값이 너무 낮아 알림 피로가 발생합니다.","fumble":"슬로우 쿼리 분석이 DB에 과도한 부하를 줬습니다! 서비스 성능이 더 나빠졌어요."}'
WHERE ticket_key = 'OPS_BE_001';

UPDATE public.tickets SET narratives = '{"critical":"포스트모템이 완벽합니다! 근본 원인과 재발 방지책이 모두 명확해요. 대성공!","success":"인시던트 리뷰를 완료하고 포스트모템 문서를 팀에 공유했습니다.","fail":"포스트모템에서 근본 원인을 명확히 파악하지 못했습니다.","fumble":"포스트모템 작성이 내부 정치로 인해 왜곡됐습니다! 재발 방지책이 부실해요."}'
WHERE ticket_key = 'OPS_BE_002';

UPDATE public.tickets SET narratives = '{"critical":"DB 용량 계획이 완벽합니다! 2년치 성장을 수용할 수 있는 구조예요. 대성공!","success":"DB 용량 계획을 수립하고 파티셔닝 전략을 검토했습니다.","fail":"용량 계획이 실제 데이터 성장 속도를 과소평가했습니다.","fumble":"파티셔닝 검토 중 현재 쿼리 패턴과 맞지 않는 구조가 발견됐습니다! 대규모 리팩토링이 필요해요."}'
WHERE ticket_key = 'OPS_BE_003';

UPDATE public.tickets SET narratives = '{"critical":"API 비용이 40% 절감됐습니다! 불필요한 쿼리가 모두 제거됐어요. 대성공!","success":"불필요한 쿼리를 제거하고 API 호출 효율을 높였습니다.","fail":"일부 최적화가 기능 동작에 영향을 미쳐 롤백이 필요합니다.","fumble":"쿼리 제거 실수로 중요한 데이터가 조회되지 않습니다! 기능 장애가 발생했어요."}'
WHERE ticket_key = 'OPS_BE_004';

UPDATE public.tickets SET narratives = '{"critical":"분산 추적이 완벽합니다! 요청 경로를 단계별로 완전히 파악해요. 대성공!","success":"분산 추적을 추가하고 서비스 간 요청 흐름을 시각화했습니다.","fail":"일부 서비스에서 추적 컨텍스트가 누락됩니다.","fumble":"분산 추적 오버헤드로 API 응답 시간이 20% 증가했습니다!"}'
WHERE ticket_key = 'OPS_BE_005';

UPDATE public.tickets SET narratives = '{"critical":"배치 정리 Job이 완벽합니다! 안정적으로 오래된 데이터를 정리해요. 대성공!","success":"배치 정리 Job을 안정화하고 모니터링을 강화했습니다.","fail":"배치 Job이 간헐적으로 실패합니다. 재시도 로직 개선이 필요해요.","fumble":"배치 Job이 잘못된 데이터를 삭제했습니다! 복구가 필요해요."}'
WHERE ticket_key = 'OPS_BE_006';

-- ============================================================
-- PHASE: OPERATE — INFRA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"알림 임계값이 완벽하게 튜닝됐습니다! 중요 알림만 정확하게 발생해요. 대성공!","success":"알림 임계값을 튜닝하고 알림 피로를 줄였습니다.","fail":"일부 임계값이 너무 엄격하거나 느슨해 재조정이 필요합니다.","fumble":"임계값 설정 실수로 중요한 알림이 발생하지 않았습니다! 장애를 늦게 발견했어요."}'
WHERE ticket_key = 'OPS_INFRA_001';

UPDATE public.tickets SET narratives = '{"critical":"Edge Function 트레이싱이 완벽합니다! 모든 실행 경로가 추적돼요. 대성공!","success":"Supabase Edge Function 트레이싱을 추가하고 성능 분석을 완성했습니다.","fail":"일부 Function에서 트레이싱 데이터가 누락됩니다.","fumble":"트레이싱 추가로 Edge Function 실행 시간이 크게 증가했습니다!"}'
WHERE ticket_key = 'OPS_INFRA_002';

UPDATE public.tickets SET narratives = '{"critical":"인프라 비용을 35% 절감했습니다! 서비스 품질은 유지하면서 비용이 대폭 줄었어요. 대성공!","success":"인프라 비용 최적화를 실행하고 불필요한 리소스를 정리했습니다.","fail":"일부 최적화가 성능에 영향을 미쳐 완전한 적용이 어렵습니다.","fumble":"비용 절감을 위해 중요한 인스턴스를 종료했습니다! 서비스 장애가 발생했어요."}'
WHERE ticket_key = 'OPS_INFRA_003';

UPDATE public.tickets SET narratives = '{"critical":"로그 로테이션 정책이 완벽합니다! 비용 절감과 데이터 보존이 최적 균형을 이뤄요. 대성공!","success":"로그 로테이션 정책을 적용하고 스토리지 비용을 절감했습니다.","fail":"로그 보존 기간이 컴플라이언스 요구사항에 맞지 않습니다.","fumble":"로그 로테이션 오류로 활성 로그 파일이 삭제됐습니다! 디버깅이 불가능해요."}'
WHERE ticket_key = 'OPS_INFRA_004';

UPDATE public.tickets SET narratives = '{"critical":"용량 계획이 완벽합니다! 트래픽 급증에도 자동으로 스케일 아웃해요. 대성공!","success":"용량 계획을 리뷰하고 스케일 준비를 완료했습니다.","fail":"예상 트래픽 증가에 대한 스케일 계획이 불충분합니다.","fumble":"용량 계획이 실제 사용 패턴을 크게 잘못 예측했습니다! 예산이 초과됐어요."}'
WHERE ticket_key = 'OPS_INFRA_005';

UPDATE public.tickets SET narratives = '{"critical":"보안 패치 자동화가 완벽합니다! CVE 발견 즉시 자동으로 패치돼요. 대성공!","success":"보안 패치 자동화 파이프라인을 구축하고 첫 번째 패치를 적용했습니다.","fail":"일부 패치가 기존 기능과 충돌합니다. 수동 검토가 필요해요.","fumble":"자동 패치가 프로덕션에 잘못 적용됐습니다! 서비스가 다운됐어요."}'
WHERE ticket_key = 'OPS_INFRA_006';

-- ============================================================
-- PHASE: OPERATE — QA (6)
-- ============================================================
UPDATE public.tickets SET narratives = '{"critical":"에러율이 0.01% 미만으로 줄었습니다! 완벽한 안정성이에요. 대성공!","success":"프로덕션 에러율 주간 리뷰를 완료하고 개선 항목을 식별했습니다.","fail":"에러율이 이번 주 목표를 초과했습니다. 원인 분석이 필요해요.","fumble":"에러율이 급증했습니다! 최근 배포에서 심각한 버그가 유입됐어요."}'
WHERE ticket_key = 'OPS_QA_001';

UPDATE public.tickets SET narratives = '{"critical":"회귀 방지 테스트가 완벽합니다! 같은 인시던트가 절대 재발하지 않아요. 대성공!","success":"인시던트를 재현하고 회귀 방지 테스트를 추가했습니다.","fail":"인시던트 재현이 불안정합니다. 환경 의존적인 문제일 수 있어요.","fumble":"회귀 방지 테스트 추가가 기존 테스트를 깨뜨렸습니다! 더 많은 수정이 필요해요."}'
WHERE ticket_key = 'OPS_QA_002';

UPDATE public.tickets SET narratives = '{"critical":"보안 취약점이 발견되지 않았습니다! 완벽한 보안 상태예요. 대성공!","success":"정기 보안 취약점 스캔을 완료하고 보고서를 작성했습니다.","fail":"중간 심각도 취약점이 발견됐습니다. 패치 계획을 수립해야 해요.","fumble":"심각한 보안 취약점이 발견됐습니다! 즉시 서비스를 점검해야 해요."}'
WHERE ticket_key = 'OPS_QA_003';

UPDATE public.tickets SET narratives = '{"critical":"밸런스 분석이 완벽합니다! 모든 포지션의 승률이 균등해요. 대성공!","success":"게임 밸런스 데이터를 분석하고 개선 포인트를 리포팅했습니다.","fail":"일부 포지션의 승률 편차가 큽니다. 밸런스 조정이 필요해요.","fumble":"데이터 분석 오류로 잘못된 밸런스 조정이 이루어졌습니다! 게임이 더 불균형해졌어요."}'
WHERE ticket_key = 'OPS_QA_004';

UPDATE public.tickets SET narratives = '{"critical":"테스트 스위트가 완벽하게 정리됐습니다! CI 통과율이 100%예요. 대성공!","success":"플리키 테스트를 수정하고 테스트 스위트를 안정화했습니다.","fail":"일부 플리키 테스트의 근본 원인을 파악하지 못했습니다.","fumble":"테스트 수정이 더 많은 플리키 테스트를 만들었습니다! 상황이 더 나빠졌어요."}'
WHERE ticket_key = 'OPS_QA_005';

UPDATE public.tickets SET narratives = '{"critical":"사용자 피드백을 모두 검증했습니다! 보고된 버그를 전부 수정했어요. 대성공!","success":"사용자 피드백을 기반으로 탐색적 테스트를 수행하고 버그를 수정했습니다.","fail":"피드백 기반 테스트에서 재현이 어려운 버그들이 발견됐습니다.","fumble":"탐색적 테스트 중 심각한 사용성 문제가 대량으로 발견됐습니다! 큰 개선이 필요해요."}'
WHERE ticket_key = 'OPS_QA_006';
