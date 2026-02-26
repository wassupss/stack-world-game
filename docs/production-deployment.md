# STACKWORLD 프로덕션 배포 가이드

> 이 문서는 STACKWORLD를 처음 프로덕션 환경에 배포하는 절차를 단계별로 안내합니다.

---

## 아키텍처 개요

```
[유저 브라우저]
    │
    ▼
[Vercel] ──── Next.js 15 App Router
    │           - /app/(auth)/login   → 로그인/회원가입
    │           - /app/(auth)/onboarding → GitHub OAuth 신규유저
    │           - /app/auth/callback  → OAuth 콜백 처리
    │           - /app/terminal       → 게임 터미널 UI
    │           - /app/api/*          → Edge API 프록시
    │
    ▼
[Supabase]
    ├── Database (PostgreSQL)
    │     - migrations/001~010 (스키마 + 게임 로직)
    │     - seed/001~005 (콘텐츠: 티켓120, 이벤트80, 아티팩트60, 레이드4, 상점16)
    │     - RLS 정책 (개인/파티/레이드 접근 제어)
    │
    ├── Auth
    │     - Email/Password 로그인
    │     - GitHub OAuth (신규 유저 → /onboarding)
    │
    ├── Edge Functions (Deno)
    │     - run_command   : 솔로 런 전체 로직
    │     - raid_command  : 레이드/파티 전체 로직
    │     - pvp_submit    : PvP 점수 계산 + 리더보드
    │     - market_trade  : 마켓 거래
    │     - shop_command  : 상점 구매/사용/스킬
    │     - cleanup_daily : 오래된 로그 정리 (UTC 03:00)
    │
    └── Realtime
          - raid_events 테이블만 구독 (Free Tier 1채널)
```

---

## 사전 준비

### 필요 계정
- [ ] [Supabase](https://supabase.com) 계정
- [ ] [Vercel](https://vercel.com) 계정
- [ ] [GitHub](https://github.com) 계정 (OAuth 앱 등록용)

### 로컬 툴
```bash
node --version    # >= 20
pnpm --version    # >= 9
supabase --version  # Supabase CLI

# 설치
npm install -g pnpm
brew install supabase/tap/supabase
npm install -g vercel
```

---

## Step 1: GitHub OAuth 앱 등록

1. [https://github.com/settings/developers](https://github.com/settings/developers) 접속
2. **New OAuth App** 클릭
3. 입력:
   ```
   Application name: STACKWORLD
   Homepage URL: https://your-domain.vercel.app
   Authorization callback URL: https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
   > `YOUR_PROJECT`는 Supabase 프로젝트 ref (Step 2에서 확인)
4. **Register application** 클릭
5. **Client ID**와 **Client Secret** 메모 (Step 3에서 사용)

---

## Step 2: Supabase 프로젝트 생성

### 2-1. 프로젝트 생성
1. [https://supabase.com](https://supabase.com) → **New Project**
2. 설정:
   ```
   프로젝트 이름: stack-world
   DB 비밀번호: (강력한 비밀번호 - 분실 불가)
   리전: ap-northeast-2 (서울)
   ```
3. 프로젝트 생성 완료 후 **Project Settings → API**에서 확인:
   - `Project URL` (= `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (= `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` key (= `SUPABASE_SERVICE_ROLE_KEY`, 비공개)

### 2-2. 마이그레이션 적용
```bash
# 프로젝트 루트에서
supabase link --project-ref YOUR_PROJECT_REF

# 로컬에서 개발한 마이그레이션 전체 적용
supabase db push
```

마이그레이션 순서:
```
001_enums_and_tables.sql  - 기본 스키마 + 모든 타입
002_rls.sql               - Row Level Security 정책
003_indexes_and_triggers.sql - 인덱스 + 트리거
004_rpc_functions.sql     - RPC 함수 (grant_credits 등)
005_run_mechanics.sql     - 스트릭/이펙트/시너지 시스템
006_shop.sql              - 상점 테이블
007~009_...               - (추가 마이그레이션)
010_probabilistic_choices.sql - 확률 기반 이벤트 선택지
```

### 2-3. Seed 데이터 삽입
```bash
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

psql $DATABASE_URL -f supabase/seed/001_tickets.sql    # 120개 티켓
psql $DATABASE_URL -f supabase/seed/002_events.sql     # 80개 이벤트
psql $DATABASE_URL -f supabase/seed/003_artifacts.sql  # 60개 아티팩트
psql $DATABASE_URL -f supabase/seed/004_raids.sql      # 4개 레이드 시나리오
psql $DATABASE_URL -f supabase/seed/005_shop_items.sql # 16개 상점 아이템
```

Seed 검증:
```sql
SELECT 'tickets' as t, COUNT(*) FROM tickets
UNION ALL SELECT 'events', COUNT(*) FROM events
UNION ALL SELECT 'artifacts', COUNT(*) FROM artifacts
UNION ALL SELECT 'raid_scenarios', COUNT(*) FROM raid_scenarios
UNION ALL SELECT 'shop_items', COUNT(*) FROM shop_items;
-- 결과: 120 / 80 / 60 / 4 / 16
```

### 2-4. GitHub OAuth Provider 활성화
1. Supabase Dashboard → **Authentication → Providers**
2. **GitHub** 클릭 → Enable
3. Step 1에서 메모한 값 입력:
   ```
   Client ID: (GitHub OAuth App Client ID)
   Client Secret: (GitHub OAuth App Client Secret)
   ```
4. **Save** 클릭

### 2-5. Auth 설정
1. **Authentication → URL Configuration**:
   ```
   Site URL: https://your-domain.vercel.app
   Redirect URLs: https://your-domain.vercel.app/auth/callback
   ```
   > Vercel 배포 전이면 임시로 `http://localhost:3000/auth/callback` 추가

### 2-6. Edge Functions 배포
```bash
supabase functions deploy run_command
supabase functions deploy raid_command
supabase functions deploy pvp_submit
supabase functions deploy market_trade
supabase functions deploy cleanup_daily
supabase functions deploy shop_command
```

Edge Function 환경변수 설정:
```bash
supabase secrets set CRON_SECRET=$(openssl rand -hex 32)
# 저장해두기: 크론 작업에서 사용
```

### 2-7. Realtime 설정 확인
```sql
-- Supabase SQL Editor에서 실행
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- raid_events 테이블이 목록에 있어야 함
```

없으면:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE raid_events;
```

---

## Step 3: Vercel 배포

### 3-1. Vercel 프로젝트 생성
1. [https://vercel.com](https://vercel.com) → **Add New Project**
2. GitHub 레포 Import
3. 설정:
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Node.js Version: 20.x
   ```

### 3-2. 환경변수 설정
Vercel Dashboard → **Settings → Environment Variables**:

| Key | Value | 환경 |
|-----|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJh...` (anon key) | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` (service_role key) | All |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |

> `SUPABASE_SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` 접두사 사용 금지

### 3-3. 배포
```bash
# GitHub push → 자동 배포 (권장)
git push origin main

# 또는 Vercel CLI
vercel --prod
```

### 3-4. 도메인 연결 (선택)
Vercel Dashboard → **Settings → Domains** → 커스텀 도메인 추가 후:
1. GitHub OAuth App의 `Authorization callback URL` 업데이트:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```
   (supabase callback URL은 변경 없음 — Supabase가 처리)
2. Supabase Auth → Site URL, Redirect URLs 도메인 업데이트

---

## Step 4: 크론 작업 설정 (cleanup_daily)

### 옵션 A: Supabase pg_cron (권장 — 별도 인프라 불필요)
```sql
-- Supabase SQL Editor에서 실행
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'stackworld-daily-cleanup',
  '0 3 * * *',  -- UTC 03:00 (한국 12:00)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup_daily',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'X-Cron-Secret', 'YOUR_CRON_SECRET',
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
      - name: Run cleanup_daily
        run: |
          curl -f -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "X-Cron-Secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT.supabase.co/functions/v1/cleanup_daily
```

GitHub Secrets 설정:
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

---

## Step 5: 배포 후 검증

### 5-1. 기본 연결 확인
```bash
# Supabase Edge Functions 상태
supabase functions list

# Vercel 배포 상태
vercel ls
```

### 5-2. 기능 체크리스트

**인증:**
- [ ] 이메일 회원가입 → 캐릭터 생성 → `/terminal` 접근
- [ ] 이메일 로그인 동작
- [ ] **GitHub 로그인** → `/auth/callback` → 신규면 `/onboarding` → `/terminal`
- [ ] GitHub 재로그인 (기존 유저) → 바로 `/terminal`

**솔로 런:**
- [ ] `run start` → 자동 draw (4장 A/B/C/D)
- [ ] `work <ticket>` → 다이스 애니메이션 → 자동 draw
- [ ] `event` → 4가지 선택지 (안전75%/균형60%/위험40%/도박25%)
- [ ] `choose 3` (도박) → roll 애니메이션 → SUCCESS/PARTIAL/FAIL 결과
- [ ] STREAK 3연속 → XP 배율 메시지
- [ ] `run end` → XP + 크레딧 획득

**레이드:**
- [ ] `raid start` → Realtime 구독 시작
- [ ] `raid action trace` → 치명/역효 확률 표시 (`치명20%/역효3%`)
- [ ] 멀티탭에서 Realtime 이벤트 수신 확인

**PvP:**
- [ ] `pvp queue --mode golf` → `pvp submit` → 운 보너스 표시

**상점:**
- [ ] `shop list` → `shop buy UPG_CRIT_BOOST` → `refactor`

### 5-3. 성능/보안 확인
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 번들에 없음 (F12 → Sources 확인)
- [ ] Rate limit: 빠르게 5회 연속 커맨드 → 429 응답 확인
- [ ] `/api/run-command` 직접 호출 시 인증 없으면 401 응답
- [ ] RLS: 다른 유저 characters row 직접 SELECT 불가 확인

---

## 모니터링

### Supabase 대시보드
- **Logs → Edge Functions**: 에러 확인
- **Database → Tables → runs**: 활성 런 현황
- **Authentication → Users**: 가입 유저 수

### Vercel 대시보드
- **Functions**: API 라우트 응답 시간
- **Analytics**: 실시간 트래픽

### 알람 기준 (Free Tier 한계)
| 지표 | 경고 | 위험 |
|------|------|------|
| 동시 레이드 | 2개 | 3개 (한계) |
| DB 행 수 (run_logs) | 4,000건 | 5,000건 |
| Edge Function 호출 | 월 450,000회 | 월 500,000회 |

---

## 롤백 절차

### 마이그레이션 롤백
```bash
# 현재 DB 상태 백업
supabase db dump -f backup_$(date +%Y%m%d).sql

# 이전 마이그레이션 상태로 복원
# Dashboard → Database → Backups → 특정 시점으로 복원 (Point-in-Time Recovery)
```

### Edge Function 롤백
```bash
# 이전 버전 태그로 재배포
git checkout v1.0.0
supabase functions deploy run_command
supabase functions deploy shop_command
```

### Vercel 롤백
```
Dashboard → Deployments → 이전 성공 배포 → ⋯ → Promote to Production
```

---

## 환경변수 전체 목록

| 변수 | 위치 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (public) | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (public) | 클라이언트용 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server only) | API 라우트용 service key |
| `NEXT_PUBLIC_APP_URL` | Vercel (public) | 앱 도메인 (OAuth 리다이렉트용) |
| `SUPABASE_URL` | Edge Function (자동) | Supabase 내부 URL |
| `SUPABASE_ANON_KEY` | Edge Function (자동) | Supabase 내부 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function (자동) | Supabase 내부 service key |
| `CRON_SECRET` | Edge Function secret | cleanup_daily 인증 |

> Edge Function의 `SUPABASE_*` 변수는 `supabase functions deploy` 시 자동 주입됨
> `CRON_SECRET`만 `supabase secrets set`으로 수동 설정 필요

---

## Free Tier 제약 요약

| 항목 | 제한 | 게임 설정 |
|------|------|----------|
| 동시 Realtime 채널 | 200개 | raid_events 1개만 사용 |
| Edge Function 호출 | 500,000/월 | rate limit 4회/초로 보호 |
| DB 크기 | 500MB | cleanup_daily로 5,000건 유지 |
| Storage | 1GB | 사용 안 함 |
| 동시 DB 연결 | 200개 | Edge Function pooling |

유저 수 기준 Free Tier 한계: **월간 활성 유저 ~200명** 수준까지 안정적 운영 가능.
