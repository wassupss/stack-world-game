-- ============================================================
-- STACKWORLD - 001: ENUMS + 기본 테이블
-- ============================================================

-- ──────────── ENUMS ────────────
CREATE TYPE public.position_type AS ENUM ('FE', 'BE', 'INFRA', 'QA');
CREATE TYPE public.core_skill_type AS ENUM (
  'problem_solving', 'debugging', 'design', 'delivery', 'collaboration'
);
CREATE TYPE public.run_phase_type AS ENUM (
  'plan', 'implement', 'test', 'deploy', 'operate'
);
CREATE TYPE public.rarity_type AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE public.artifact_type_enum AS ENUM (
  'template', 'pipeline', 'observability', 'pattern'
);
CREATE TYPE public.raid_mode_type AS ENUM ('incident', 'launch');
CREATE TYPE public.pvp_mode_type AS ENUM ('golf', 'speedrun');
CREATE TYPE public.run_status_type AS ENUM (
  'active', 'completed', 'failed', 'abandoned'
);
CREATE TYPE public.raid_status_type AS ENUM (
  'waiting', 'active', 'completed', 'failed'
);
CREATE TYPE public.pvp_match_status_type AS ENUM (
  'queuing', 'active', 'completed'
);

-- ──────────── 5-1) 계정/캐릭터 ────────────

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle  TEXT NOT NULL UNIQUE CHECK (char_length(handle) BETWEEN 2 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.characters (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 20),
  credits    INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)   -- 1인 1캐릭터
);

CREATE TABLE public.position_mastery (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  position     public.position_type NOT NULL,
  xp           BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level        INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, position)
);

CREATE TABLE public.core_mastery (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  core         public.core_skill_type NOT NULL,
  xp           BIGINT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level        INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, core)
);

CREATE TABLE public.character_titles (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  title_key    TEXT NOT NULL,
  earned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id, title_key)
);

-- ──────────── 5-2) 콘텐츠 카탈로그 ────────────

CREATE TABLE public.tickets (
  ticket_key         TEXT PRIMARY KEY,
  phase              public.run_phase_type NOT NULL,
  position_tag       public.position_type NOT NULL,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  base_time_cost     SMALLINT NOT NULL CHECK (base_time_cost BETWEEN 1 AND 5),
  base_risk_delta    SMALLINT NOT NULL CHECK (base_risk_delta BETWEEN -2 AND 3),
  base_quality_delta SMALLINT NOT NULL CHECK (base_quality_delta BETWEEN -2 AND 3),
  reward_xp          JSONB NOT NULL DEFAULT '{}',
  reward_items       JSONB NOT NULL DEFAULT '{}',
  version            INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.events (
  event_key   TEXT PRIMARY KEY,
  phase       public.run_phase_type NOT NULL,
  severity    SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  choices     JSONB NOT NULL DEFAULT '[]',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  version     INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.artifacts (
  artifact_key   TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  type           public.artifact_type_enum NOT NULL,
  rarity         public.rarity_type NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  base_effect    JSONB NOT NULL DEFAULT '{}',
  crafting_cost  JSONB NOT NULL DEFAULT '{}',
  version        INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.blueprints (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id  UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  artifact_key  TEXT NOT NULL REFERENCES public.artifacts(artifact_key),
  quality_grade TEXT NOT NULL CHECK (quality_grade IN ('B', 'A', 'S')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.inventory (
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  artifact_key TEXT NOT NULL REFERENCES public.artifacts(artifact_key),
  qty          INTEGER NOT NULL DEFAULT 0 CHECK (qty >= 0),
  PRIMARY KEY (character_id, artifact_key)
);

-- ──────────── 5-3) 시즌 ────────────

CREATE TABLE public.seasons (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────── 파티 ────────────

CREATE TABLE public.parties (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::TEXT), 1, 6)),
  leader_id  UUID NOT NULL REFERENCES public.characters(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.party_members (
  party_id     UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (party_id, character_id)
);

-- ──────────── 5-3) 런 ────────────

CREATE TABLE public.runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  season_id    UUID REFERENCES public.seasons(id),
  tier         SMALLINT NOT NULL DEFAULT 1 CHECK (tier BETWEEN 1 AND 5),
  seed         TEXT NOT NULL,
  status       public.run_status_type NOT NULL DEFAULT 'active',
  phase        public.run_phase_type NOT NULL DEFAULT 'plan',
  time         INTEGER NOT NULL DEFAULT 100,
  risk         INTEGER NOT NULL DEFAULT 10,
  debt         INTEGER NOT NULL DEFAULT 0,
  quality      INTEGER NOT NULL DEFAULT 50,
  score        INTEGER NOT NULL DEFAULT 0,
  cmd_count    INTEGER NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at     TIMESTAMPTZ
);

CREATE TABLE public.run_commands (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id           UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  character_id     UUID NOT NULL REFERENCES public.characters(id),
  command          TEXT NOT NULL,
  args             JSONB NOT NULL DEFAULT '{}',
  result           JSONB NOT NULL DEFAULT '{}',
  idempotency_key  TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.run_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  event_key    TEXT NOT NULL,
  phase        public.run_phase_type NOT NULL,
  choice_index SMALLINT,
  result       JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────── 5-3) 레이드 ────────────

CREATE TABLE public.raid_scenarios (
  scenario_key  TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  mode          public.raid_mode_type NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  time_limit_sec INTEGER NOT NULL,
  initial_kpi   JSONB NOT NULL,
  target_kpi    JSONB NOT NULL,
  events        JSONB NOT NULL DEFAULT '[]',
  actions       JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.raids (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id        UUID NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  scenario_key    TEXT NOT NULL REFERENCES public.raid_scenarios(scenario_key),
  mode            public.raid_mode_type NOT NULL,
  tier            SMALLINT NOT NULL DEFAULT 1,
  status          public.raid_status_type NOT NULL DEFAULT 'waiting',
  kpi             JSONB NOT NULL DEFAULT '{}',
  time_limit_sec  INTEGER NOT NULL,
  phase           TEXT,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Realtime 대상 테이블
CREATE TABLE public.raid_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id      UUID NOT NULL REFERENCES public.raids(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  actor_id     UUID REFERENCES public.characters(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.raid_commands (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id          UUID NOT NULL REFERENCES public.raids(id) ON DELETE CASCADE,
  character_id     UUID NOT NULL REFERENCES public.characters(id),
  action_key       TEXT NOT NULL,
  args             JSONB NOT NULL DEFAULT '{}',
  result           JSONB NOT NULL DEFAULT '{}',
  idempotency_key  TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────── 5-3) PvP ────────────

CREATE TABLE public.pvp_matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode       public.pvp_mode_type NOT NULL,
  tier       SMALLINT NOT NULL DEFAULT 1,
  seed       TEXT NOT NULL,
  season_id  UUID REFERENCES public.seasons(id),
  status     public.pvp_match_status_type NOT NULL DEFAULT 'queuing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.pvp_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID NOT NULL REFERENCES public.pvp_matches(id) ON DELETE CASCADE,
  character_id  UUID NOT NULL REFERENCES public.characters(id),
  run_id        UUID REFERENCES public.runs(id),
  score         INTEGER NOT NULL DEFAULT 0,
  command_count INTEGER,
  elapsed_sec   INTEGER,
  quality       INTEGER,
  debt_penalty  INTEGER,
  submitted_at  TIMESTAMPTZ,
  rank          SMALLINT,
  UNIQUE (match_id, character_id)
);

CREATE TABLE public.leaderboards (
  season_id    UUID NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  mode         public.pvp_mode_type NOT NULL,
  character_id UUID NOT NULL REFERENCES public.characters(id),
  total_score  INTEGER NOT NULL DEFAULT 0,
  match_count  INTEGER NOT NULL DEFAULT 0,
  rank         INTEGER,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (season_id, mode, character_id)
);

-- ──────────── 5-4) 경제 ────────────

CREATE TABLE public.market_listings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      UUID NOT NULL REFERENCES public.characters(id),
  artifact_key   TEXT NOT NULL REFERENCES public.artifacts(artifact_key),
  qty            INTEGER NOT NULL CHECK (qty > 0),
  price_credits  INTEGER NOT NULL CHECK (price_credits > 0),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_key        TEXT NOT NULL,
  target_artifact_key TEXT NOT NULL REFERENCES public.artifacts(artifact_key),
  qty_required        INTEGER NOT NULL CHECK (qty_required > 0),
  reward_credits      INTEGER NOT NULL CHECK (reward_credits > 0),
  reward_xp           JSONB NOT NULL DEFAULT '{}',
  expires_at          TIMESTAMPTZ NOT NULL,
  filled_by           UUID REFERENCES public.characters(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────── 5-4) 통계/정리 ────────────

CREATE TABLE public.daily_character_stats (
  day           DATE NOT NULL,
  character_id  UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  runs_count    INTEGER NOT NULL DEFAULT 0,
  avg_score     NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_quality   NUMERIC(10,2) NOT NULL DEFAULT 0,
  avg_debt_delta NUMERIC(10,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (day, character_id)
);

CREATE TABLE public.cleanup_jobs (
  job_key      TEXT PRIMARY KEY,
  last_run_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────── Realtime 활성화 (raid_events만) ────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.raid_events;
