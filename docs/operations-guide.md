# STACKWORLD 사내 운영 가이드

> 대상: 사내 5~20명 운영 팀
> Free Tier 제약 내에서 안정적으로 운영하기 위한 가이드

---

## 1. 시스템 제약 요약

| 항목 | 제한값 | 이유 |
|------|--------|------|
| 동시 레이드 | 최대 3개 | Realtime 연결 절약 |
| 커맨드 rate limit | 초당 4회 | 과부하 방지 |
| 로그 보관 | 14일 또는 5,000건 | DB 용량 절약 |
| Realtime 사용 | raid_events만 | Free tier 제한 |
| 계약 갱신 | 하루 10개 | 배치 최소화 |
| 파티 크기 | 3~5명 | 레이드 균형 |

---

## 2. 일상 운영

### 2-1) 일일 확인 사항

```sql
-- 활성 런 수 확인
SELECT COUNT(*) FROM runs WHERE status = 'active';

-- 활성 레이드 수 확인 (3개 초과 시 확인 필요)
SELECT COUNT(*) FROM raids WHERE status IN ('waiting', 'active');

-- cleanup_jobs 마지막 실행 확인
SELECT * FROM cleanup_jobs ORDER BY last_run_at;

-- 상점 아이템 재고 확인 (캐릭터당 소모품/수식어 보유량)
SELECT item_key, SUM(qty) as total_qty
FROM character_items
WHERE qty > 0
GROUP BY item_key
ORDER BY total_qty DESC;
```

### 2-2) cleanup_daily 크론 설정

Supabase Dashboard → Database → Extensions → pg_cron 활성화 후:

```sql
-- 매일 새벽 3시 UTC 실행
SELECT cron.schedule(
  'cleanup_daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/cleanup_daily',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}',
    body := '{}'
  );
  $$
);
```

또는 외부 크론(GitHub Actions, Vercel Cron):

```yaml
# .github/workflows/cleanup.yml
on:
  schedule:
    - cron: '0 3 * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "X-Cron-Secret: ${{ secrets.CRON_SECRET }}" \
            https://your-project.supabase.co/functions/v1/cleanup_daily
```

---

## 3. 시즌 관리

### 3-1) 시즌 종료

```sql
-- 시즌 종료 (자동 정지 또는 수동)
SELECT admin_end_season('시즌_UUID');

-- 리더보드 최종 순위 확인
SELECT
  c.name,
  lb.mode,
  lb.total_score,
  lb.match_count,
  RANK() OVER (PARTITION BY lb.mode ORDER BY lb.total_score DESC) as rank
FROM leaderboards lb
JOIN characters c ON lb.character_id = c.id
WHERE lb.season_id = '시즌_UUID'
ORDER BY lb.mode, rank;
```

### 3-2) 새 시즌 시작

```sql
-- 새 시즌 생성 (4주)
INSERT INTO seasons (name, starts_at, ends_at, is_active)
VALUES (
  'Season 2: Beta',
  NOW(),
  NOW() + INTERVAL '28 days',
  TRUE
);
```

### 3-3) 시즌 리셋 범위

**초기화하는 것:**
- leaderboards (시즌별로 자동 분리됨)
- pvp_matches / pvp_entries (시즌별 분리)

**초기화하지 않는 것 (누적):**
- characters (크레딧, 이름, queued_modifier)
- position_mastery / core_mastery (XP/레벨)
- character_titles
- inventory
- character_upgrades (영구 업그레이드)
- character_items (소모품 재고)

**관리자가 원하면 개별 리셋:**
```sql
SELECT admin_reset_character('캐릭터_UUID');
```

---

## 4. 관리자 기능

### 4-1) 유저 밴

```sql
-- Supabase Auth에서 직접 처리
-- Dashboard → Authentication → Users → Ban User
-- 또는:
UPDATE auth.users SET banned_until = '9999-12-31' WHERE id = '유저_UUID';
```

### 4-2) 데이터 조회

```sql
-- 모든 캐릭터 현황
SELECT
  c.name,
  c.credits,
  (SELECT SUM(level) FROM position_mastery pm WHERE pm.character_id = c.id) as total_pos_levels,
  (SELECT COUNT(*) FROM runs r WHERE r.character_id = c.id AND r.status = 'completed') as completed_runs,
  (SELECT SUM(level) FROM character_upgrades cu WHERE cu.character_id = c.id) as total_upgrade_levels
FROM characters c
ORDER BY total_pos_levels DESC;

-- 오늘 활동 내역
SELECT
  c.name,
  ds.runs_count,
  ds.avg_score,
  ds.avg_quality
FROM daily_character_stats ds
JOIN characters c ON ds.character_id = c.id
WHERE ds.day = CURRENT_DATE
ORDER BY ds.avg_score DESC;

-- 상점 구매 현황 (최근 7일)
SELECT
  c.name,
  cu.item_key,
  cu.level,
  cu.purchased_at
FROM character_upgrades cu
JOIN characters c ON cu.character_id = c.id
WHERE cu.purchased_at > NOW() - INTERVAL '7 days'
ORDER BY cu.purchased_at DESC;
```

### 4-3) 강제 런/레이드 종료

```sql
-- 고착된 런 강제 종료
UPDATE runs SET status = 'abandoned', ended_at = NOW()
WHERE id = '런_UUID' AND status = 'active';

-- 고착된 레이드 강제 종료
UPDATE raids SET status = 'failed', ended_at = NOW()
WHERE id = '레이드_UUID' AND status IN ('waiting', 'active');
```

### 4-4) 상점 아이템 가격 조정

```sql
-- 특정 아이템 가격 변경 (다음 구매부터 적용)
UPDATE shop_items SET price = 60 WHERE item_key = 'UPG_CRIT_BOOST';

-- 임시 할인 이벤트 (운영 필요 시)
UPDATE shop_items SET price = FLOOR(price * 0.8) WHERE item_type = 'consumable';
```

---

## 5. 콘텐츠 관리

### 5-1) 콘텐츠 생성 규칙 (밸런스 패치 가이드)

**티켓 key 규칙:**
```
{PHASE}_{POSITION}_{번호}
예: PLAN_FE_001, IMPL_BE_012, TEST_QA_024
```

**이벤트 key 규칙:**
```
EVT_{PHASE}_{번호}
예: EVT_PLAN_001, EVT_DEPLOY_016
```

**아티팩트 key 규칙:**
```
{TYPE_PREFIX}_{설명}
예: TMPL_REACT_COMPONENT, PIPE_CI_CD_BASIC, OBS_DISTRIBUTED_TRACE
```

**상점 아이템 key 규칙:**
```
{TYPE_PREFIX}_{설명}
UPG_CRIT_BOOST       → upgrade 타입
ITEM_COFFEE          → consumable 타입
SKILL_REFACTOR       → skill 타입
MOD_SPEEDRUN         → modifier 타입
```

### 5-2) 티켓 밸런스 패치

```sql
-- 티켓 수정 (version 자동 증가)
UPDATE tickets
SET
  base_time_cost = 3,
  base_risk_delta = -1,
  reward_xp = '{"position": {"FE": 60}}'::jsonb,
  version = version + 1
WHERE ticket_key = 'PLAN_FE_001';
```

또는 seed 파일 수정 후 재삽입 (ON CONFLICT DO UPDATE가 version 증가 처리):

```bash
psql $DATABASE_URL -f supabase/seed/001_tickets.sql
```

### 5-3) 이벤트/아티팩트 추가

새 파일 생성 후 seed 실행:
```bash
# 새 이벤트 추가
psql $DATABASE_URL -f supabase/seed/006_events_patch.sql

# 새 아티팩트 추가
psql $DATABASE_URL -f supabase/seed/007_artifacts_season2.sql
```

### 5-4) 상점 아이템 추가/수정

```bash
# 새 아이템 추가
psql $DATABASE_URL -f supabase/seed/00X_shop_patch.sql

# 또는 직접 SQL
INSERT INTO shop_items (item_key, item_type, name, description, price, effect_data, max_level, rarity)
VALUES ('UPG_NEW_FEATURE', 'upgrade', '새 업그레이드', '설명', 100, '{"effect": 0.1}', 3, 'rare');
```

---

## 6. 게임 메카닉 운영 참고

### 6-1) STREAK 시스템

연속 성공 시 XP 배율이 올라간다. 운영 시 참고:
- x3: XP ×1.5
- x5: XP ×2.0 + CRITICAL 임계값 강화
- x10: 다음 work 자동 CRITICAL 보장 (5연속마다 반복)

STREAK가 너무 쉽다면 티켓의 `base_risk_delta`를 올려 성공률을 낮춘다.

### 6-2) RISK 위기 사고 임계값

```
RISK 50~69: 3% 확률 → TIME-3, RISK+5
RISK 70~89: 8% 확률 → TIME-5, RISK+8
RISK 90+:  20% 확률 → TIME-10, RISK+15
```

`UPG_RISK_DAMPENER` 업그레이드로 확률 감소 가능 (레벨당 20% 감소).

### 6-3) STATUS EFFECT 종류

| 효과 | 발동 | 내용 |
|------|------|------|
| `flow_state` | CRITICAL 발생 | 성공률 +15% (3턴) |
| `tired` | FUMBLE 발생 | FUMBLE 위험 ↑ (2턴) |
| `focused` | STREAK x5 | QUAL +5/work (3턴) |
| `guaranteed_critical` | STREAK x10 | 다음 work 자동 CRITICAL |
| `risk_shield` | ITEM_RISK_SHIELD 사용 | RISK 사고 차단 (5턴) |
| `success_boost` | ITEM_ENERGY_DRINK 사용 | 성공 임계값 -0.05 (3턴) |

---

## 7. Free Tier 모니터링

### 7-1) DB 용량 확인

```sql
-- 테이블별 용량
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

### 7-2) Realtime 연결 수 확인

Supabase Dashboard → Reports → Realtime에서 확인.
Free tier는 동시 연결 200개 제한. raid_events만 구독하므로 최대 3(레이드) × 5(파티원) = 15개 연결.

### 7-3) Edge Function 호출 수

Supabase Dashboard → Edge Functions에서 모니터링.
Free tier: 월 500,000회. 사내 20명 × 300회/일 × 30일 = 180,000회. 여유 있음.
shop_command 추가로 추가 호출 발생 (약 20~50회/일 추가 예상).

---

## 8. 트러블슈팅

### 증상: 레이드가 시작 안 됨
```sql
-- 현재 활성 레이드 수 확인
SELECT COUNT(*) FROM raids WHERE status IN ('waiting', 'active');
-- 3개 이상이면 기존 레이드 종료 필요
```

### 증상: cleanup_daily가 실행 안 됨
```sql
SELECT * FROM cleanup_jobs;
-- last_run_at이 48시간 이상 됐으면 수동 실행
curl -X POST \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  https://your-project.supabase.co/functions/v1/cleanup_daily
```

### 증상: Rate limit 오류 (429)
- 클라이언트의 커맨드 입력 속도 제한 (초당 4회)
- `isProcessing` 상태로 UI에서 이미 방지
- Edge Function의 `rateLimitMap`은 메모리 기반 → 재배포 시 리셋

### 증상: Realtime 이벤트 미수신
1. `raid_events` 테이블이 `supabase_realtime` publication에 포함됐는지 확인:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
2. 클라이언트 채널 구독 상태 확인 (`isConnected` 상태)
3. Supabase Dashboard → Realtime에서 연결 상태 확인

### 증상: 상점 구매 후 효과가 안 보임
- `shop buy` → 업그레이드/스킬은 다음 `work`부터 적용 (즉시 런 재시작 불필요)
- `shop equip <modifier>` → 다음 `run start` 시 적용 (`queued_modifier` 컬럼 확인)
- `shop use <consumable>` → 활성 런이 있어야 사용 가능

```sql
-- 특정 캐릭터의 업그레이드 확인
SELECT item_key, level FROM character_upgrades WHERE character_id = '캐릭터_UUID';

-- 활성 런의 active_effects 확인
SELECT id, active_modifier, active_effects FROM runs WHERE character_id = '캐릭터_UUID' AND status = 'active';
```

### 증상: draw/event 후 인터랙티브 버튼이 안 보임
- LogPanel의 `level: "interactive"` 로그 확인 (브라우저 콘솔)
- TerminalShell의 `onCommand` prop이 LogPanel에 전달됐는지 확인
- 버튼은 한 번 클릭하면 비활성화됨 (재사용 불가, 새 draw/event 필요)
