-- =============================================================================
-- STACKWORLD: Artifacts Seed Data
-- File: 003_artifacts.sql
-- Total: 60 artifacts (4 types × 15, rarity: common×6, rare×5, epic×3, legendary×1)
-- Types: template, pipeline, observability, pattern
-- =============================================================================

INSERT INTO public.artifacts (artifact_key, name, type, rarity, description, base_effect, crafting_cost)
VALUES

-- ============================================================
-- TEMPLATE artifacts (TMPL_001 ~ TMPL_015)
-- Code and architecture templates that speed up development
-- ============================================================

-- Common (6)
('TMPL_001', 'API Wrapper Boilerplate', 'template', 'common',
  'A battle-tested HTTP client wrapper with retry logic and error handling baked in. Saves you from reinventing the wheel on every project.',
  '{"time_mult": 0.95, "quality_bonus": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

('TMPL_002', 'Component Scaffold', 'template', 'common',
  'Standard UI component structure with prop types, storybook story, and unit test included. Never start from scratch again.',
  '{"time_mult": 0.95, "quality_bonus": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

('TMPL_003', 'Test Fixture Template', 'template', 'common',
  'Pre-built test data factories and fixture generators. Write meaningful tests without the boilerplate headache.',
  '{"time_mult": 0.93, "quality_bonus": 2}'::jsonb,
  '{"credits": 120, "materials": {"code_fragment": 2}}'::jsonb),

('TMPL_004', 'README Template', 'template', 'common',
  'A comprehensive README structure covering setup, usage, API docs, and contribution guidelines. First impressions matter.',
  '{"quality_bonus": 2, "debt_reduction": 1}'::jsonb,
  '{"credits": 80, "materials": {"code_fragment": 1}}'::jsonb),

('TMPL_005', 'PR Description Template', 'template', 'common',
  'Structured pull request template with checklist, screenshots section, and testing steps. Reviewers will thank you.',
  '{"quality_bonus": 1, "debt_reduction": 1}'::jsonb,
  '{"credits": 80, "materials": {"code_fragment": 1}}'::jsonb),

('TMPL_006', 'Config File Template', 'template', 'common',
  'Environment-aware configuration template with validation schema and sensible defaults for dev, staging, and production.',
  '{"risk_mult": 0.95, "debt_reduction": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

-- Rare (5)
('TMPL_007', 'CQRS Scaffold', 'template', 'rare',
  'Command Query Responsibility Segregation starter kit with separate read/write models, command bus, and query handlers.',
  '{"time_mult": 0.9, "quality_bonus": 3, "debt_reduction": 2}'::jsonb,
  '{"credits": 350, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('TMPL_008', 'Event-Sourcing Template', 'template', 'rare',
  'Complete event store implementation with aggregate roots, domain events, and projection rebuilding capabilities.',
  '{"time_mult": 0.88, "quality_bonus": 3, "risk_mult": 0.9}'::jsonb,
  '{"credits": 400, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

('TMPL_009', 'BFF Template', 'template', 'rare',
  'Backend-for-Frontend pattern with client-specific API aggregation, data transformation layer, and auth proxy.',
  '{"time_mult": 0.9, "quality_bonus": 2, "risk_mult": 0.88}'::jsonb,
  '{"credits": 320, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('TMPL_010', 'OpenAPI Spec Template', 'template', 'rare',
  'Auto-generated OpenAPI 3.1 specification with request/response examples, error schemas, and SDK generation config.',
  '{"quality_bonus": 4, "debt_reduction": 2, "time_mult": 0.92}'::jsonb,
  '{"credits": 300, "materials": {"plan_scroll": 1, "code_fragment": 2}}'::jsonb),

('TMPL_011', 'Monorepo Template', 'template', 'rare',
  'Full monorepo setup with workspace configuration, shared packages, build orchestration, and cross-package testing.',
  '{"time_mult": 0.87, "quality_bonus": 3, "debt_reduction": 2}'::jsonb,
  '{"credits": 380, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

-- Epic (3)
('TMPL_012', 'Full DDD Template', 'template', 'epic',
  'Domain-Driven Design complete scaffold: bounded contexts, aggregates, value objects, domain services, and anti-corruption layers.',
  '{"time_mult": 0.82, "quality_bonus": 5, "debt_reduction": 3, "risk_mult": 0.85}'::jsonb,
  '{"credits": 750, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

('TMPL_013', 'Micro-Frontend Template', 'template', 'epic',
  'Module federation setup with independently deployable frontends, shared design system, and runtime composition.',
  '{"time_mult": 0.8, "quality_bonus": 5, "risk_mult": 0.83}'::jsonb,
  '{"credits": 800, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

('TMPL_014', 'Platform Engineering Template', 'template', 'epic',
  'Internal developer platform scaffold with self-service portal, infrastructure catalog, golden paths, and developer metrics.',
  '{"time_mult": 0.78, "quality_bonus": 6, "debt_reduction": 4, "risk_mult": 0.8}'::jsonb,
  '{"credits": 900, "materials": {"plan_scroll": 3, "blueprint": 1, "code_fragment": 6}}'::jsonb),

-- Legendary (1)
('TMPL_015', 'Golden Template', 'template', 'legendary',
  'The mythical complete production-ready full-stack template. Auth, payments, i18n, accessibility, observability, CI/CD — all pre-configured and battle-tested by 10,000 devs.',
  '{"time_mult": 0.7, "quality_bonus": 10, "debt_reduction": 5, "risk_mult": 0.7, "xp_mult": 1.2}'::jsonb,
  '{"credits": 2500, "materials": {"plan_scroll": 5, "blueprint": 3, "relic_shard": 1}}'::jsonb),

-- ============================================================
-- PIPELINE artifacts (PIPE_001 ~ PIPE_015)
-- CI/CD pipelines that automate your deployment workflow
-- ============================================================

-- Common (6)
('PIPE_001', 'Lint Runner', 'pipeline', 'common',
  'Automated linting pipeline that catches code style issues before they reach review. ESLint, Prettier, and language-specific linters included.',
  '{"quality_bonus": 1, "debt_reduction": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

('PIPE_002', 'Test Runner', 'pipeline', 'common',
  'Parallel test execution pipeline with coverage reporting and flaky test detection. Know your code works before it ships.',
  '{"risk_mult": 0.95, "quality_bonus": 2}'::jsonb,
  '{"credits": 120, "materials": {"code_fragment": 2}}'::jsonb),

('PIPE_003', 'Build Pipeline', 'pipeline', 'common',
  'Optimized build pipeline with caching, incremental builds, and artifact storage. Compile once, deploy everywhere.',
  '{"time_mult": 0.95, "quality_bonus": 1}'::jsonb,
  '{"credits": 110, "materials": {"code_fragment": 2}}'::jsonb),

('PIPE_004', 'Docker Build', 'pipeline', 'common',
  'Multi-stage Docker build pipeline with layer caching, image scanning, and registry push automation.',
  '{"risk_mult": 0.93, "time_mult": 0.95}'::jsonb,
  '{"credits": 130, "materials": {"code_fragment": 2}}'::jsonb),

('PIPE_005', 'Deploy Script', 'pipeline', 'common',
  'Battle-tested deployment script with pre/post hooks, health check validation, and basic rollback support.',
  '{"risk_mult": 0.92, "time_mult": 0.95}'::jsonb,
  '{"credits": 150, "materials": {"code_fragment": 2}}'::jsonb),

('PIPE_006', 'Env Validation', 'pipeline', 'common',
  'Environment variable validation pipeline that catches missing configs before deployment. Never ship a broken env again.',
  '{"risk_mult": 0.9, "debt_reduction": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 1}}'::jsonb),

-- Rare (5)
('PIPE_007', 'Blue-Green Deploy', 'pipeline', 'rare',
  'Zero-traffic-loss blue-green deployment with automated health checks, traffic switching, and instant rollback capability.',
  '{"risk_mult": 0.82, "time_mult": 0.9, "quality_bonus": 2}'::jsonb,
  '{"credits": 350, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('PIPE_008', 'Canary Release', 'pipeline', 'rare',
  'Gradual traffic shifting pipeline with automated metrics analysis and safety gates. Roll out to 5%, then 20%, then 100%.',
  '{"risk_mult": 0.8, "quality_bonus": 3, "time_mult": 0.92}'::jsonb,
  '{"credits": 400, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

('PIPE_009', 'Automated Rollback', 'pipeline', 'rare',
  'Error-rate triggered rollback system that monitors your deployment and reverts automatically when things go wrong.',
  '{"risk_mult": 0.78, "quality_bonus": 2}'::jsonb,
  '{"credits": 380, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('PIPE_010', 'Multi-Env Pipeline', 'pipeline', 'rare',
  'Promotion-based pipeline: dev → staging → prod with environment-specific configs, approval gates, and state tracking.',
  '{"risk_mult": 0.85, "time_mult": 0.88, "quality_bonus": 3}'::jsonb,
  '{"credits": 320, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('PIPE_011', 'Security Scan Pipeline', 'pipeline', 'rare',
  'SAST, DAST, dependency audit, and secret scanning integrated into your CI. Catch vulnerabilities before they hit production.',
  '{"risk_mult": 0.75, "quality_bonus": 4, "debt_reduction": 2}'::jsonb,
  '{"credits": 420, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

-- Epic (3)
('PIPE_012', 'Zero-Downtime Deploy Pipeline', 'pipeline', 'epic',
  'Sophisticated zero-downtime pipeline combining blue-green, database migration coordination, cache warming, and traffic draining.',
  '{"risk_mult": 0.7, "time_mult": 0.82, "quality_bonus": 5}'::jsonb,
  '{"credits": 800, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

('PIPE_013', 'GitOps Pipeline', 'pipeline', 'epic',
  'Full GitOps implementation with declarative config management, drift detection, and automated sync across environments.',
  '{"risk_mult": 0.72, "time_mult": 0.8, "quality_bonus": 5, "debt_reduction": 3}'::jsonb,
  '{"credits": 850, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

('PIPE_014', 'ML Model Deploy Pipeline', 'pipeline', 'epic',
  'End-to-end ML deployment: model validation, A/B testing framework, shadow mode, champion/challenger routing, and drift monitoring.',
  '{"risk_mult": 0.75, "time_mult": 0.78, "quality_bonus": 6, "xp_mult": 1.1}'::jsonb,
  '{"credits": 900, "materials": {"plan_scroll": 3, "blueprint": 1, "code_fragment": 6}}'::jsonb),

-- Legendary (1)
('PIPE_015', 'Autonomous Deploy System', 'pipeline', 'legendary',
  'The pinnacle of deployment automation. Self-healing infrastructure, predictive rollback, AI-guided traffic management, and autonomous incident response. Ships itself.',
  '{"risk_mult": 0.6, "time_mult": 0.72, "quality_bonus": 8, "debt_reduction": 5, "xp_mult": 1.2}'::jsonb,
  '{"credits": 3000, "materials": {"plan_scroll": 5, "blueprint": 3, "relic_shard": 1}}'::jsonb),

-- ============================================================
-- OBSERVABILITY artifacts (OBS_001 ~ OBS_015)
-- Monitoring and logging tools for production visibility
-- ============================================================

-- Common (6)
('OBS_001', 'Error Logger', 'observability', 'common',
  'Structured error logging with stack traces, user context, and severity levels. Know about errors before your users tweet about them.',
  '{"risk_mult": 0.95, "quality_bonus": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

('OBS_002', 'Uptime Monitor', 'observability', 'common',
  'Simple HTTP health check monitor with alerting and status page generation. Is your service up? Know in seconds.',
  '{"risk_mult": 0.93, "quality_bonus": 1}'::jsonb,
  '{"credits": 110, "materials": {"code_fragment": 2}}'::jsonb),

('OBS_003', 'Latency Tracker', 'observability', 'common',
  'P50/P95/P99 latency tracking with histogram visualization. See exactly where your app is slow.',
  '{"quality_bonus": 2, "risk_mult": 0.95}'::jsonb,
  '{"credits": 120, "materials": {"code_fragment": 2}}'::jsonb),

('OBS_004', 'Log Aggregator', 'observability', 'common',
  'Centralized log collection with structured parsing, log levels, and basic search. One place to grep all your logs.',
  '{"risk_mult": 0.93, "quality_bonus": 1}'::jsonb,
  '{"credits": 130, "materials": {"code_fragment": 2}}'::jsonb),

('OBS_005', 'Alert Rule Set', 'observability', 'common',
  'Pre-configured alert rules for common failure scenarios: error rate spikes, latency degradation, disk pressure, and memory exhaustion.',
  '{"risk_mult": 0.9, "quality_bonus": 2}'::jsonb,
  '{"credits": 150, "materials": {"code_fragment": 2}}'::jsonb),

('OBS_006', 'Dashboard Template', 'observability', 'common',
  'Ready-to-import dashboard with the four golden signals: latency, traffic, errors, and saturation. Works with Grafana and Datadog.',
  '{"quality_bonus": 2, "debt_reduction": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

-- Rare (5)
('OBS_007', 'Distributed Trace Collector', 'observability', 'rare',
  'OpenTelemetry-based distributed tracing that follows requests across microservices. Find that mysterious 2-second delay.',
  '{"risk_mult": 0.85, "quality_bonus": 3, "time_mult": 0.92}'::jsonb,
  '{"credits": 350, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('OBS_008', 'SLO Tracker', 'observability', 'rare',
  'Service Level Objective tracking with error budget burn rate alerts and historical compliance reporting.',
  '{"risk_mult": 0.82, "quality_bonus": 4, "debt_reduction": 2}'::jsonb,
  '{"credits": 380, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('OBS_009', 'Anomaly Detector', 'observability', 'rare',
  'Statistical anomaly detection on your metrics. Catches weird patterns before they become outages.',
  '{"risk_mult": 0.78, "quality_bonus": 3}'::jsonb,
  '{"credits": 420, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

('OBS_010', 'Cost Monitor', 'observability', 'rare',
  'Cloud cost tracking with per-service breakdown, budget alerts, and optimization recommendations. Stop the bill shock.',
  '{"quality_bonus": 2, "debt_reduction": 3, "risk_mult": 0.88}'::jsonb,
  '{"credits": 300, "materials": {"plan_scroll": 1, "code_fragment": 2}}'::jsonb),

('OBS_011', 'User Journey Tracker', 'observability', 'rare',
  'Real-user interaction tracking with funnel analysis, rage click detection, and session replay integration.',
  '{"quality_bonus": 4, "risk_mult": 0.85, "xp_mult": 1.05}'::jsonb,
  '{"credits": 400, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

-- Epic (3)
('OBS_012', 'AI-Powered Incident Detector', 'observability', 'epic',
  'ML-driven anomaly detection that correlates signals across logs, metrics, and traces to predict incidents 10 minutes before they happen.',
  '{"risk_mult": 0.72, "quality_bonus": 5, "xp_mult": 1.1}'::jsonb,
  '{"credits": 800, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

('OBS_013', 'Full Observability Stack', 'observability', 'epic',
  'Complete logs-metrics-traces triad with correlation IDs, unified search, and automated root cause analysis dashboards.',
  '{"risk_mult": 0.7, "quality_bonus": 6, "debt_reduction": 3, "time_mult": 0.85}'::jsonb,
  '{"credits": 850, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 6}}'::jsonb),

('OBS_014', 'Real-User Monitoring', 'observability', 'epic',
  'Client-side performance monitoring with Core Web Vitals tracking, device/network segmentation, and business impact correlation.',
  '{"quality_bonus": 6, "risk_mult": 0.75, "xp_mult": 1.1, "debt_reduction": 2}'::jsonb,
  '{"credits": 780, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

-- Legendary (1)
('OBS_015', 'Omniscient Eye', 'observability', 'legendary',
  'The all-seeing observability platform. Correlates every signal across your entire stack, predicts failures, auto-remediates common issues, and generates post-mortems automatically.',
  '{"risk_mult": 0.6, "quality_bonus": 10, "debt_reduction": 5, "time_mult": 0.8, "xp_mult": 1.2}'::jsonb,
  '{"credits": 3000, "materials": {"plan_scroll": 5, "blueprint": 3, "relic_shard": 1}}'::jsonb),

-- ============================================================
-- PATTERN artifacts (PATT_001 ~ PATT_015)
-- Software design patterns for architectural excellence
-- ============================================================

-- Common (6)
('PATT_001', 'Singleton Pattern', 'pattern', 'common',
  'Classic single-instance pattern with thread-safe lazy initialization. One instance to rule them all.',
  '{"quality_bonus": 1, "debt_reduction": 1}'::jsonb,
  '{"credits": 80, "materials": {"code_fragment": 1}}'::jsonb),

('PATT_002', 'Factory Pattern', 'pattern', 'common',
  'Object creation pattern that decouples instantiation logic from usage. Swap implementations without touching calling code.',
  '{"quality_bonus": 2, "debt_reduction": 1}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

('PATT_003', 'Observer Pattern', 'pattern', 'common',
  'Event subscription pattern enabling loose coupling between producers and consumers. Build reactive systems the right way.',
  '{"quality_bonus": 2, "debt_reduction": 1, "risk_mult": 0.97}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

('PATT_004', 'Strategy Pattern', 'pattern', 'common',
  'Algorithm encapsulation pattern for runtime behavior swapping. Replace if/else chains with clean, extensible strategies.',
  '{"quality_bonus": 2, "debt_reduction": 2}'::jsonb,
  '{"credits": 110, "materials": {"code_fragment": 2}}'::jsonb),

('PATT_005', 'Command Pattern', 'pattern', 'common',
  'Action encapsulation with undo/redo support. Treat operations as first-class objects for queuing, logging, and rollback.',
  '{"quality_bonus": 2, "risk_mult": 0.95, "debt_reduction": 1}'::jsonb,
  '{"credits": 120, "materials": {"code_fragment": 2}}'::jsonb),

('PATT_006', 'Adapter Pattern', 'pattern', 'common',
  'Interface compatibility bridge between incompatible systems. Wrap any legacy API in a modern interface without rewriting.',
  '{"quality_bonus": 1, "debt_reduction": 2, "risk_mult": 0.95}'::jsonb,
  '{"credits": 100, "materials": {"code_fragment": 2}}'::jsonb),

-- Rare (5)
('PATT_007', 'Saga Pattern', 'pattern', 'rare',
  'Distributed transaction coordination via choreography or orchestration. Keep data consistent across microservices without two-phase commit.',
  '{"quality_bonus": 3, "risk_mult": 0.82, "debt_reduction": 2}'::jsonb,
  '{"credits": 380, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('PATT_008', 'CQRS Pattern', 'pattern', 'rare',
  'Command Query Responsibility Segregation implementation guide with separate models, event handlers, and projection strategies.',
  '{"quality_bonus": 4, "time_mult": 0.9, "debt_reduction": 2}'::jsonb,
  '{"credits": 400, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

('PATT_009', 'Circuit Breaker', 'pattern', 'rare',
  'Fault tolerance pattern that stops cascading failures. Open circuit on repeated failures, half-open on recovery probe.',
  '{"risk_mult": 0.78, "quality_bonus": 3}'::jsonb,
  '{"credits": 350, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('PATT_010', 'Bulkhead Pattern', 'pattern', 'rare',
  'Resource isolation pattern preventing one failing component from sinking the whole ship. Separate thread pools, queues, and connections.',
  '{"risk_mult": 0.8, "quality_bonus": 3, "debt_reduction": 1}'::jsonb,
  '{"credits": 360, "materials": {"plan_scroll": 1, "code_fragment": 3}}'::jsonb),

('PATT_011', 'Strangler Fig Pattern', 'pattern', 'rare',
  'Safe legacy system migration strategy. Route traffic incrementally to new implementations while the old system still runs.',
  '{"risk_mult": 0.75, "quality_bonus": 3, "debt_reduction": 4, "time_mult": 0.92}'::jsonb,
  '{"credits": 420, "materials": {"plan_scroll": 1, "code_fragment": 4}}'::jsonb),

-- Epic (3)
('PATT_012', 'Event Sourcing + CQRS Combo', 'pattern', 'epic',
  'Complete event sourcing with CQRS: immutable event log, aggregate reconstruction, multiple read projections, and time-travel debugging.',
  '{"quality_bonus": 6, "risk_mult": 0.75, "debt_reduction": 3, "time_mult": 0.85}'::jsonb,
  '{"credits": 850, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

('PATT_013', 'Reactive Architecture Pattern', 'pattern', 'epic',
  'Reactive Manifesto implementation: responsive, resilient, elastic, message-driven. Build systems that bend without breaking.',
  '{"quality_bonus": 5, "risk_mult": 0.72, "time_mult": 0.82, "xp_mult": 1.1}'::jsonb,
  '{"credits": 800, "materials": {"plan_scroll": 2, "blueprint": 1, "code_fragment": 5}}'::jsonb),

('PATT_014', 'DDD Pattern Pack', 'pattern', 'epic',
  'Domain-Driven Design pattern collection: aggregates, value objects, domain events, repositories, and bounded context mapping.',
  '{"quality_bonus": 6, "debt_reduction": 4, "risk_mult": 0.78, "time_mult": 0.83}'::jsonb,
  '{"credits": 900, "materials": {"plan_scroll": 3, "blueprint": 1, "code_fragment": 6}}'::jsonb),

-- Legendary (1)
('PATT_015', 'Architecture Codex', 'pattern', 'legendary',
  'The complete pattern library with automated refactoring tools. Every pattern from GoF to cloud-native, with AST-based codemod scripts to apply them to your existing codebase instantly.',
  '{"quality_bonus": 10, "debt_reduction": 8, "risk_mult": 0.65, "time_mult": 0.72, "xp_mult": 1.25}'::jsonb,
  '{"credits": 3000, "materials": {"plan_scroll": 5, "blueprint": 3, "relic_shard": 1}}'::jsonb)

ON CONFLICT (artifact_key) DO UPDATE SET
  name          = EXCLUDED.name,
  type          = EXCLUDED.type,
  rarity        = EXCLUDED.rarity,
  description   = EXCLUDED.description,
  base_effect   = EXCLUDED.base_effect,
  crafting_cost = EXCLUDED.crafting_cost,
  version       = public.artifacts.version + 1;
