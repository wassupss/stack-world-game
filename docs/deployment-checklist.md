# STACKWORLD 배포 체크리스트

---

## Phase 1: 로컬 개발 환경

### 사전 요구사항
- [ ] Node.js >= 20
- [ ] pnpm >= 9
- [ ] Supabase CLI 설치: `brew install supabase/tap/supabase`
- [ ] Docker Desktop (Supabase local 실행용)

### 로컬 Supabase 시작
```bash
# 프로젝트 루트에서
supabase start

# 출력 예시:
# API URL: http://localhost:54321
# Studio URL: http://localhost:54323
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# anon key: eyJh...
# service_role key: eyJh...
```

### 환경변수 설정
```bash
cp .env.example apps/web/.env.local
# 로컬 키로 편집
```

### DB 마이그레이션 실행
```bash
supabase db reset  # 또는 개별 실행:
# psql $DATABASE_URL -f supabase/migrations/001_enums_and_tables.sql
# psql $DATABASE_URL -f supabase/migrations/002_rls.sql
# psql $DATABASE_URL -f supabase/migrations/003_indexes_and_triggers.sql
# psql $DATABASE_URL -f supabase/migrations/004_rpc_functions.sql
# psql $DATABASE_URL -f supabase/migrations/005_run_mechanics.sql
# psql $DATABASE_URL -f supabase/migrations/006_shop.sql
```

### Seed 데이터 삽입
```bash
pnpm db:seed
# 또는 개별:
# psql $DATABASE_URL -f supabase/seed/001_tickets.sql
# psql $DATABASE_URL -f supabase/seed/002_events.sql
# psql $DATABASE_URL -f supabase/seed/003_artifacts.sql
# psql $DATABASE_URL -f supabase/seed/004_raids.sql
# psql $DATABASE_URL -f supabase/seed/005_shop_items.sql
```

### Seed 검증
```sql
SELECT COUNT(*) FROM tickets;        -- 120
SELECT COUNT(*) FROM events;         -- 80
SELECT COUNT(*) FROM artifacts;      -- 60
SELECT COUNT(*) FROM raid_scenarios; -- 4
SELECT COUNT(*) FROM shop_items;     -- 16
```

### Edge Functions 로컬 실행
```bash
supabase functions serve
# 별도 터미널에서
```

### Next.js 개발 서버
```bash
pnpm install
pnpm dev
# http://localhost:3000
```

### 로컬 테스트 체크리스트

**기본 흐름:**
- [ ] 회원가입 → 캐릭터 생성 확인
- [ ] `help` 커맨드 동작 (shop 카테고리 포함)
- [ ] `run start` → `draw` → `work <ticket_key>` → `run end` 흐름
- [ ] `event` → 인터랙티브 버튼 표시 + `0/1/2` 단축키 QuickMode
- [ ] `draw` → 카드 UI 표시 + `A/B/C` 단축키 QuickMode
- [ ] `work` → 다이스 애니메이션 (AnimatedRollEntry) 확인
- [ ] STREAK 3연속 → XP 배율 메시지 확인

**상점 흐름:**
- [ ] `shop list` → 아이템 목록 + 인터랙티브 구매 버튼 표시
- [ ] `shop buy UPG_CRIT_BOOST` → 크레딧 차감 + 업그레이드 적용 확인
- [ ] `shop buy ITEM_COFFEE` → 소모품 재고 증가 확인
- [ ] `shop use ITEM_COFFEE` → 활성 런 active_effects에 flow_state 추가 확인
- [ ] `shop equip MOD_SPEEDRUN` → StatusPanel에 수식어 표시 확인
- [ ] `run start` → queued_modifier 소비 + active_modifier 적용 확인
- [ ] `shop buy SKILL_REFACTOR` → `refactor` 커맨드 사용 확인
- [ ] `refactor` → DEBT 감소 확인

**파티/레이드/기타:**
- [ ] `party create` → `party join <code>` 흐름
- [ ] `raid start --mode incident` 동작 (3명 파티 필요)
- [ ] Realtime raid_events 구독 확인 (브라우저 2개 탭)
- [ ] `market sell` → `market list` → `market buy` 흐름
- [ ] `pvp queue --mode golf` → `pvp submit` 흐름
- [ ] cleanup_daily 수동 실행 확인

**UI 인터랙티브:**
- [ ] StatusPanel에 STREAK 배지 표시
- [ ] StatusPanel에 active_effects 잔여 턴 표시
- [ ] StatusPanel에 queued_modifier / active_modifier 표시
- [ ] CommandInput QuickMode ⚡ 힌트바 표시
- [ ] ESC로 QuickMode 해제

---

## Phase 2: Supabase 프로젝트 생성 (프로덕션)

### Supabase 프로젝트 설정
1. [ ] https://supabase.com → 새 프로젝트 생성
2. [ ] 프로젝트 이름: `stack-world`
3. [ ] DB 비밀번호 저장 (분실 불가)
4. [ ] 리전: `ap-northeast-2` (서울)

### 마이그레이션 프로덕션 적용
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Seed 데이터 프로덕션 삽입
```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
psql $DATABASE_URL -f supabase/seed/001_tickets.sql
psql $DATABASE_URL -f supabase/seed/002_events.sql
psql $DATABASE_URL -f supabase/seed/003_artifacts.sql
psql $DATABASE_URL -f supabase/seed/004_raids.sql
psql $DATABASE_URL -f supabase/seed/005_shop_items.sql
```

### Supabase 설정 확인
- [ ] Authentication → Email 로그인 활성화
- [ ] Authentication → Site URL: `https://your-vercel-domain.vercel.app`
- [ ] Realtime → `raid_events` 테이블 publication 확인:
  ```sql
  SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  -- raid_events가 목록에 있어야 함
  ```
- [ ] RLS 활성화 확인 (모든 관련 테이블: shop_items, character_upgrades, character_items 포함)
- [ ] Edge Functions 배포:
  ```bash
  supabase functions deploy run_command
  supabase functions deploy raid_command
  supabase functions deploy pvp_submit
  supabase functions deploy market_trade
  supabase functions deploy cleanup_daily
  supabase functions deploy shop_command
  ```
- [ ] Edge Functions 환경변수 설정:
  ```bash
  supabase secrets set CRON_SECRET=your-random-secret-here
  ```

---

## Phase 3: Vercel 배포

### Vercel 프로젝트 설정
1. [ ] https://vercel.com → Import GitHub Repository
2. [ ] Root Directory: `apps/web`
3. [ ] Framework: Next.js (자동 감지)
4. [ ] Node.js Version: 20.x

### 환경변수 설정 (Vercel Dashboard)
```
NEXT_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJh...
SUPABASE_SERVICE_ROLE_KEY = eyJh...  (서버 전용, NEXT_PUBLIC_ 아님)
NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
```

### 배포 명령어
```bash
# Vercel CLI
vercel --prod

# 또는 GitHub push → 자동 배포
git push origin main
```

### 배포 후 확인
- [ ] `https://your-domain.vercel.app` 접속
- [ ] 회원가입 동작 확인
- [ ] Edge Functions 호출 확인 (F12 → Network)
- [ ] Realtime 연결 확인 (레이드 참여 후)
- [ ] `/api/shop-command` 엔드포인트 응답 확인

---

## Phase 4: 크론 작업 설정

### 옵션 A: Supabase pg_cron (권장)
```sql
-- Supabase Dashboard → SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'stackworld-daily-cleanup',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup_daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### 옵션 B: GitHub Actions
```yaml
# .github/workflows/cleanup.yml
name: Daily Cleanup
on:
  schedule:
    - cron: '0 3 * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Run cleanup
        run: |
          curl -f -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "X-Cron-Secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT.supabase.co/functions/v1/cleanup_daily
```

### 옵션 C: Vercel Cron
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

## Phase 5: 론칭 전 최종 확인

### 보안 체크
- [ ] NEXT_PUBLIC_ 환경변수에 service_role_key 없음
- [ ] RLS 정책 전체 테이블 적용 확인 (shop_items, character_upgrades, character_items 포함)
- [ ] Edge Functions JWT 검증 활성화 (`verify_jwt = true`)
- [ ] idempotency_key UNIQUE 제약 확인
- [ ] Rate limiting 동작 확인

### 기능 체크
- [ ] 솔로 런 전체 흐름 (start → draw → work × N → event → choose → end)
- [ ] CRITICAL/FUMBLE 판정 + 다이스 애니메이션 확인
- [ ] STREAK 시스템 (x3 XP배율, x5 CRITICAL강화, x10 자동CRITICAL)
- [ ] RISK 위기 사고 발생 확인 (RISK 70+ 구간에서 테스트)
- [ ] STATUS EFFECT 부여/소멸 확인
- [ ] 포지션 시너지 x2/x3/x5 확인
- [ ] 상점 전체 흐름 (shop list → shop buy → shop use/equip → refactor/code_review)
- [ ] 수식어 장착 → run start 시 active_modifier 적용 확인
- [ ] 레이드 전체 흐름 (party create → party join × 2 → raid start → raid action × N)
- [ ] PvP 전체 흐름 (pvp queue → run start+end → pvp submit)
- [ ] 마켓 전체 흐름 (sell → list → buy)
- [ ] 계약 납품 흐름 (contract list → deliver)
- [ ] cleanup_daily 수동 실행 확인

### 성능 체크
- [ ] 동시 레이드 3개 동시 실행 테스트
- [ ] Realtime 구독 5명 동시 연결 테스트
- [ ] Rate limit 초당 4회 초과 시 429 응답 확인
- [ ] shop_command Edge Function 응답 시간 확인 (업그레이드 조회 포함)

### 데이터 체크
```sql
-- 최종 seed 확인
SELECT 'tickets' as table_name, COUNT(*) as cnt FROM tickets
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'artifacts', COUNT(*) FROM artifacts
UNION ALL SELECT 'raid_scenarios', COUNT(*) FROM raid_scenarios
UNION ALL SELECT 'shop_items', COUNT(*) FROM shop_items;

-- 기대값:
-- tickets: 120
-- events: 80
-- artifacts: 60
-- raid_scenarios: 4
-- shop_items: 16
```

---

## 롤백 계획

### 마이그레이션 롤백
```bash
# Supabase migrations는 down 스크립트 별도 관리
# 긴급 시 이전 스냅샷에서 복원
supabase db remote commit  # 현재 상태 저장
# Dashboard → Database → Backups에서 복원
```

### Edge Functions 롤백
```bash
# 이전 버전 배포
supabase functions deploy run_command --project-ref OLD_REF
supabase functions deploy shop_command --project-ref OLD_REF
```

### Vercel 롤백
```bash
# Vercel Dashboard → Deployments → 이전 배포 → Promote to Production
```
