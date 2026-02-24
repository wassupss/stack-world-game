# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev
pnpm dev                    # Start Next.js dev server (apps/web)
pnpm build                  # Build web app
pnpm lint                   # Lint all packages
pnpm typecheck              # TypeScript check all packages

# Supabase
pnpm db:start               # Start local Supabase instance
pnpm db:stop                # Stop local Supabase instance
pnpm db:reset               # Reset DB and re-run all migrations
pnpm db:migrate             # Push migrations to remote
pnpm functions:serve        # Serve Edge Functions locally
pnpm functions:deploy       # Deploy all Edge Functions to Supabase

# Seed (run after db:reset)
psql $DATABASE_URL -f supabase/seed/001_tickets.sql
psql $DATABASE_URL -f supabase/seed/002_events.sql
# ... through 005_shop_items.sql
```

No test framework is configured. TypeScript strict mode + Zod schemas + RLS policies provide safety guarantees.

## Architecture

### Monorepo Structure
- `apps/web/` — Next.js 15 App Router (only app)
- `packages/shared/` — TypeScript types and constants, imported as `@stack-world/shared`
- `supabase/` — Migrations (001–006), Edge Functions (Deno), seed data

### Command Flow
Every game action follows this chain:
```
CommandInput → executor.ts → /api/*-command → Edge Function → Supabase (RLS enforced)
```

1. **`lib/commands/parser.ts`** — Tokenizes raw input into `ParsedCommand`
2. **`lib/commands/registry.ts`** — `CommandDef[]` defining all valid commands, syntax, autocomplete
3. **`lib/commands/executor.ts`** — Large switch-case; dispatches to API routes; returns `ExecuteResult` with `logs[]`, optional `quickMode`, optional `autoRefresh`
4. **`apps/web/app/api/*/route.ts`** — Thin proxies: validate auth, forward to Edge Function with `Authorization` header
5. **`supabase/functions/*/index.ts`** — Deno Edge Functions: Zod validation, idempotency check, rate limiting, DB mutations

### Key Patterns

**Idempotency**: Every state-changing Edge Function checks `run_commands(idempotency_key)` before processing. Client sends UUID per request. Prevents double-execution on retry.

**Seeded RNG**: `seededRng(seed, salt)` in run_command makes events/rolls deterministic and replayable. Seed stored on the `runs` row at start.

**Rate limiting**: In-memory sliding window in Edge Functions — 4 commands/sec per character_id.

**AutoRefresh**: After mutating commands (`work`, `choose`, `run start`, `shop buy/use`), executor returns `autoRefresh: true` which triggers StatusPanel re-fetch via `/api/commands` `action: "status"`.

**Realtime**: Only `raid_events` table uses Supabase Realtime (Free tier has 1 channel). All other state is polled. `useRaidRealtime.ts` manages subscription lifecycle.

**State authority**: Supabase is the single source of truth. No optimistic updates.

### UI Architecture (`components/terminal/`)
- `TerminalShell.tsx` — Owns all UI state; composes all panels
- `CommandInput.tsx` — Accepts `quickMode` prop; shows `⚡ QUICK` hint bar + intercepts single-key input for event choices (0/1/2) and card draws (A/B/C)
- `LogPanel.tsx` — Virtual scroll; renders `LogLine[]` with special rendering for `level: "interactive"` (clickable choices/cards), `level: "roll"` (animated dice rolls via `AnimatedRollEntry`)
- `StatusPanel.tsx` — Character stats, active run/raid info; refreshed on `autoRefresh`
- `ContentPanel.tsx` — Event choice UI / ticket card selection

### Database Schema Key Points
- All enums defined in migration 001: `position_type (FE/BE/INFRA/QA)`, `run_phase_type (plan/implement/test/deploy/operate)`, `rarity_type`, `raid_mode_type`, `run_status_type`, etc.
- `runs` table carries game state: `time`, `risk`, `debt`, `quality`, plus streak columns (`current_streak`, `position_streak`, `position_streak_tag`), `active_effects (JSONB)`, `active_modifier`, `skill_cooldowns (JSONB)`
- `characters` has `queued_modifier` — applied to next run's `active_modifier` at `run start`
- `raid_events` is the only Realtime-enabled table
- RLS helper functions: `my_character_id()`, `is_party_member(party_id)`, `is_raid_member(raid_id)`

### Adding Content
Content lives in `supabase/seed/` as UPSERT SQL (key-based versioning). To add tickets/events/artifacts, update the seed file and re-run against the DB. See `docs/content-creation-guide.md` for balance rules and key naming conventions.

### Free Tier Constraints (hard limits)
- Max concurrent raids: 3 (`MAX_CONCURRENT_RAIDS`)
- Rate limit: 4 commands/sec per character (`CMD_RATE_LIMIT_PER_SEC`)
- Log retention: 14 days / 5,000 rows — pruned by `cleanup_daily` Edge Function (UTC 03:00 cron)
- Only `raid_events` uses Realtime; everything else must poll

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # server/Edge Function only
```
