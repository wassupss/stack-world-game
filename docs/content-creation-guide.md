# STACKWORLD 콘텐츠 생성 규칙

> 향후 밸런스 패치 및 신규 콘텐츠 추가 시 참고 가이드

---

## 1. 티켓 설계 원칙

### Key 규칙
```
{PHASE}_{POSITION}_{번호(3자리)}
PLAN_FE_001   → 계획 단계, FE 포지션, 1번
IMPL_BE_012   → 구현 단계, BE 포지션, 12번
TEST_QA_024   → 테스트 단계, QA 포지션, 24번
DEPLOY_INFRA_006 → 배포 단계, INFRA 포지션, 6번
OPS_FE_003    → 운영 단계, FE 포지션, 3번
```

### 밸런스 가이드라인

| 항목 | 범위 | 설계 의도 |
|------|------|-----------|
| `base_time_cost` | 1~5 | 1=단순작업, 5=복잡한 작업 |
| `base_risk_delta` | -2~+3 | 음수=리스크 감소(좋음), 양수=리스크 증가(나쁨) |
| `base_quality_delta` | -2~+3 | 음수=품질 감소, 양수=품질 향상 |

**phase별 티켓 특성:**
- PLAN: time_cost 낮음(1~3), risk_delta 음수 위주 (리스크 감소)
- IMPLEMENT: time_cost 중간(2~4), quality_delta 다양 (구현 품질 다양)
- TEST: time_cost 중간(2~3), risk_delta 음수 위주 (버그 발견으로 리스크 감소)
- DEPLOY: time_cost 높음(3~5), risk_delta 다양 (배포는 위험 요소 있음)
- OPERATE: time_cost 낮음(1~3), risk_delta 음수 위주 (안정화)

**업그레이드 반영 참고:**
- `UPG_TIME_EFFICIENCY` (레벨당 TIME -1) → time_cost 1인 티켓은 거의 무소비
- `UPG_CRIT_BOOST` (레벨당 critical_threshold -0.02) → 5레벨 시 +10% CRITICAL 확률
- `MOD_SPEEDRUN` 시 time_cost ×1.5 → DEPLOY 티켓 설계 시 참고

### XP 설계
```json
{
  "position": {
    "FE": 40,     // 주 포지션 XP (40~80)
    "BE": 10      // 부 포지션 (10~20)
  },
  "core": {
    "problem_solving": 10,  // 상황에 맞는 코어 (10~20)
    "design": 5
  }
}
```

### 재료 설계
| 재료 | 드롭 단계 | 용도 |
|------|-----------|------|
| `plan_scroll` | PLAN | 템플릿 아티팩트 제작 재료 |
| `circuit_board` | IMPLEMENT | 파이프라인 아티팩트 제작 재료 |
| `test_crystal` | TEST | 관측성 아티팩트 제작 재료 |
| `deploy_key` | DEPLOY | 파이프라인/패턴 아티팩트 제작 재료 |
| `infra_node` | OPERATE/DEPLOY | 희귀 아티팩트 재료 |
| `debug_token` | TEST/OPERATE | 관측성 아티팩트 재료 |

---

## 2. 이벤트 설계 원칙

### Key 규칙
```
EVT_{PHASE}_{번호(3자리)}
EVT_PLAN_001, EVT_IMPL_016, EVT_TEST_008, EVT_DEPLOY_012, EVT_OPS_004
```

### Severity 가이드
| severity | 의미 | time_delta 범위 |
|----------|------|-----------------|
| 1 | 경미 (알림 수준) | -2~+2 |
| 2 | 보통 (주의 필요) | -3~+3 |
| 3 | 심각 (즉각 대응) | -5~+5 |
| 4 | 위기 (다중 자원 영향) | -8~+8 |
| 5 | 재난 (런 실패 가능) | -10~+10 |

### choices 설계 (3개 필수)
```json
[
  {
    // 선택 0: 기본 선택지 - 안전하지만 느림
    "label": "표준 절차 따르기",
    "description": "검증된 방법으로 처리. 시간이 걸리지만 안전.",
    "time_delta": 5,
    "risk_delta": -1,
    "debt_delta": 0,
    "quality_delta": 1,
    "bonus_event_chance": 0.05
  },
  {
    // 선택 1: 고급 선택지 - 해금 필요, 더 좋은 결과
    "label": "전문 도구 사용 (고급)",
    "description": "특정 아티팩트/숙련이 필요한 고급 처리법.",
    "required_command": "trace",   // 해금된 커맨드 보유 시
    "time_delta": 2,
    "risk_delta": -3,
    "debt_delta": -1,
    "quality_delta": 2
  },
  {
    // 선택 2: 위험 선택지 - 빠르지만 risk/debt 증가
    "label": "빠른 임시방편",
    "description": "당장은 해결되지만 기술 부채가 쌓임.",
    "time_delta": -3,
    "risk_delta": 2,
    "debt_delta": 3,
    "quality_delta": -2,
    "bonus_event_chance": 0.2  // 추가 이벤트 발생 확률 높음
  }
]
```

**인터랙티브 UI 참고:** `event` 커맨드 실행 시 choices가 클릭 가능한 버튼으로 표시된다. `choose 0/1/2` 입력 또는 QuickMode(0/1/2 키) 모두 동작한다.

### tags 가이드
```sql
-- 권장 태그 목록
ARRAY['scope', 'change', 'requirement']  -- 요구사항 관련
ARRAY['performance', 'latency', 'bottleneck']  -- 성능 관련
ARRAY['security', 'vulnerability', 'cve']  -- 보안 관련
ARRAY['reliability', 'incident', 'outage']  -- 안정성 관련
ARRAY['debt', 'refactor', 'legacy']  -- 기술 부채 관련
ARRAY['dependency', 'upgrade', 'compatibility']  -- 의존성 관련
```

---

## 3. 아티팩트 설계 원칙

### Key 규칙
```
{TYPE_PREFIX}_{설명_UPPER_SNAKE}
TMPL_REACT_COMPONENT         → template 타입
PIPE_CI_CD_CANARY            → pipeline 타입
OBS_DISTRIBUTED_TRACE        → observability 타입
PTRN_CIRCUIT_BREAKER         → pattern 타입
```

### base_effect 설계

#### 티켓 효과 (ticket_modifiers)
```json
{
  "ticket_modifiers": {
    "phase": "implement",    // 특정 phase에만 적용 (null이면 전체)
    "position": "FE",        // 특정 포지션에만 (null이면 전체)
    "time_mult": 0.85,       // 시간 비용 85%로 감소
    "risk_mult": 1.0,        // 리스크 배율 (1.0=변화없음)
    "quality_add": 2,        // 품질 고정 보너스
    "debt_add": 0            // 부채 보너스 (음수=감소)
  }
}
```

#### 레이드 KPI 효과
```json
{
  "raid_kpi_bonus": {
    "error_rate_reduce": 5,    // 레이드 액션 시 에러율 추가 감소
    "success_rate_add": 3      // 성공률 추가 증가
  }
}
```

### Rarity별 가이드

| rarity | crafting_cost | base_effect 강도 |
|--------|---------------|-----------------|
| common | 100cr | time_mult: 0.9, quality_add: 1 |
| rare | 300cr + 재료 | time_mult: 0.8, quality_add: 2 |
| epic | 800cr + 희귀 재료 | time_mult: 0.7, quality_add: 3 + 레이드 효과 |
| legendary | 2000cr + 복합 재료 | time_mult: 0.6, quality_add: 5 + 강력한 레이드 효과 |

---

## 4. 레이드 시나리오 설계 원칙

### 시간 제한
- 인시던트 레이드: 600~900초 (10~15분)
- 런칭 레이드: 24~48시간 (비동기)

### KPI 설계
```json
{
  "initial_kpi": {
    "error_rate": 40,        // 시작 에러율 (높을수록 심각)
    "latency_p95": 5000,     // 시작 P95 응답시간 (ms)
    "success_rate": 55,      // 시작 성공률
    "deploy_health": 60,     // 배포 건강도 (선택)
    "target_error_rate": 5,  // 목표 에러율 (이하여야 승리)
    "target_success_rate": 95 // 목표 성공률 (이상이어야 승리)
  }
}
```

### 이벤트 타이밍 설계
- 0초: 초기 상황 설명
- 60~120초 간격: 상황 악화 이벤트 (KPI 감소)
- 중간: 힌트 이벤트 (원인 파악)
- 후반: 전환점 이벤트 (자연 개선 또는 추가 위기)
- 마지막: 결말 이벤트 (승리 조건 달성 지원 또는 타임아웃 경고)

### 액션 효율 설계
- 각 액션은 최소 1개 포지션의 bonus > 1.0
- 핵심 액션(승리에 가장 중요)은 INFRA 또는 BE에 높은 보너스
- QA는 배포/테스트 관련 액션에 보너스
- time_cost_sec + cooldown_sec으로 남용 방지

---

## 5. 상점 아이템 설계 원칙

### Key 규칙
```
{TYPE_PREFIX}_{설명_UPPER_SNAKE}
UPG_CRIT_BOOST       → upgrade 타입 (영구 업그레이드)
ITEM_COFFEE          → consumable 타입 (소모품)
SKILL_REFACTOR       → skill 타입 (스킬 언락)
MOD_SPEEDRUN         → modifier 타입 (런 수식어)
```

### item_type별 가이드

#### upgrade (영구 업그레이드, max_level 1~5)
- `effect_data` 예시:
  ```json
  {"crit_threshold_delta": -0.02}     // CRITICAL 임계값 조정 (레벨당 적용)
  {"fumble_threshold_delta": 0.02}    // FUMBLE 임계값 조정
  {"time_cost_reduction": 1}          // TIME 소모 감소 (정수)
  {"incident_prob_multiplier": 0.8}   // 사고 확률 배율 (레벨당 곱셈)
  {"xp_multiplier_bonus": 0.1}        // XP 배율 보너스 (+10%/레벨)
  {"starting_quality_bonus": 5}       // 런 시작 QUAL 보너스
  ```
- 가격은 레벨업마다 10% 상승: `price × 1.1^현재레벨`
- 밸런스 기준: 5레벨 풀업 시 의미있되 압도적이지 않게

#### consumable (소모품, max_level 1, 복수 구매 가능)
- `effect_data` 예시:
  ```json
  {"time_bonus": 20}                                                  // TIME 즉시 회복
  {"quality_bonus": 15}                                               // QUAL 즉시 증가
  {"debt_reduction": 20}                                              // DEBT 즉시 감소
  {"effect": {"type": "flow_state", "magnitude": 0.15, "turns_left": 3}}   // STATUS EFFECT 부여
  {"effect": {"type": "risk_shield", "magnitude": 1.0, "turns_left": 5}}   // RISK 사고 차단
  {"effect": {"type": "success_boost", "magnitude": 0.05, "turns_left": 3}} // 성공률 임시 향상
  ```
- 사용 가능한 effect type: `flow_state`, `tired`, `focused`, `guaranteed_critical`, `risk_shield`, `success_boost`
- 가격 참고: 즉시 효과 35~50cr, 지속 효과 40~60cr

#### skill (스킬 언락, max_level 1, 1회 구매 영구)
- `effect_data` 예시:
  ```json
  {"command": "refactor", "effect": {"debt_reduction": 20}, "cooldown_works": 5}
  {"command": "code_review", "effect": {"risk_reduction": 15, "quality_bonus": 5}, "cooldown_works": 4}
  ```
- `cooldown_works × 30초` = 실제 쿨다운 시간 (타임스탬프 기반)
- 가격 기준: 200~300cr (영구 효과이므로 고가)

#### modifier (런 수식어, max_level 1, 복수 구매 가능)
- `effect_data` 예시:
  ```json
  {"time_cost_multiplier": 1.5, "xp_multiplier": 2.0}        // 스피드런: TIME 소모 ↑, XP ↑
  {"success_threshold_delta": -0.1, "xp_multiplier": 0.8}    // 안전모드: 성공 쉽고 XP ↓
  {"crit_threshold_delta": -0.1, "fumble_threshold_delta": 0.1, "xp_multiplier": 2.5}  // 챌린지
  ```
- `run start` 시 `queued_modifier`가 있으면 자동 소비 + `active_modifier` 세팅
- 가격 기준: 30~120cr (일회성 런 효과)

### 상점 밸런스 가이드

| 업그레이드 | 풀업 효과 | 비용(총합) |
|-----------|-----------|----------|
| UPG_CRIT_BOOST Lv5 | CRITICAL 확률 +10% | ~305cr |
| UPG_TIME_EFFICIENCY Lv5 | TIME -5/work | ~366cr |
| UPG_XP_AMPLIFIER Lv5 | XP +50% | ~611cr |
| UPG_RISK_DAMPENER Lv3 | 사고확률 ×0.512 | ~264cr |

신규 업그레이드 추가 시 총합 비용 300~600cr 범위 내로 조정 권장.

---

## 6. Seed 데이터 검증 쿼리

```sql
-- 티켓 밸런스 검증
SELECT
  phase,
  position_tag,
  COUNT(*) as cnt,
  AVG(base_time_cost) as avg_time,
  AVG(base_risk_delta) as avg_risk,
  AVG(base_quality_delta) as avg_quality
FROM tickets
GROUP BY phase, position_tag
ORDER BY phase, position_tag;

-- 이벤트 severity 분포
SELECT phase, severity, COUNT(*) FROM events GROUP BY phase, severity ORDER BY phase, severity;

-- 아티팩트 rarity 분포
SELECT type, rarity, COUNT(*) FROM artifacts GROUP BY type, rarity ORDER BY type, rarity;

-- 모든 레이드 시나리오
SELECT scenario_key, mode, time_limit_sec,
  jsonb_array_length(events) as event_count,
  jsonb_array_length(actions) as action_count
FROM raid_scenarios;

-- 상점 아이템 타입별 분포
SELECT item_type, rarity, COUNT(*), AVG(price) as avg_price
FROM shop_items
GROUP BY item_type, rarity
ORDER BY item_type, rarity;
```

---

## 7. 신규 콘텐츠 추가 프로세스

1. **밸런스 검토** → 기존 티켓/이벤트/상점 통계 확인
2. **설계** → 위 가이드라인에 따라 key 명명 + 수치 결정
3. **파일 작성** → `supabase/seed/0XX_패치명.sql`
4. **로컬 테스트** → `psql $DATABASE_URL -f supabase/seed/0XX_패치명.sql`
5. **검증 쿼리 실행** → 위 쿼리로 분포 확인
6. **프로덕션 적용** → `psql $PROD_DATABASE_URL -f supabase/seed/0XX_패치명.sql`
7. **게임 공지** → Slack/팀 채널에 패치 내용 공유

### 상점 아이템 추가 시 추가 확인 사항
- `effect_data` 키가 `run_command/handleWork`, `shop_command/handleUse`, `handleSkill`에서 처리되는지 확인
- 신규 `effect.type` 추가 시 `packages/shared/src/types/game.ts`의 `StatusEffectType`과 `run_command/index.ts`의 `applyEffectsToThresholds` 업데이트 필요
