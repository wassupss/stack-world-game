// ============================================================
// STACKWORLD - 커맨드 실행기
// 클라이언트 측 커맨드 실행 → API 라우트 호출
// ============================================================
import type { ParsedCommand } from "./parser";
import type { LogLine, QuickMode } from "@stack-world/shared";
import { COMMAND_MAP } from "./registry";

export interface ExecuteResult {
  logs: LogLine[];
  data?: Record<string, unknown>;
  quickMode?: QuickMode | null;
  autoRefresh?: boolean;
}

type SupabaseClient = {
  from: (table: string) => unknown;
  auth: { getUser: () => Promise<{ data: { user: unknown } }> };
};

export async function executeCommand(
  parsed: ParsedCommand,
  context: {
    supabase: SupabaseClient;
    characterId: string;
    activeRunId?: string;
    activeRaidId?: string;
    onStateUpdate?: () => void;
  },
): Promise<ExecuteResult> {
  const { name, subcommand, args, flags } = parsed;
  const idempotencyKey = `${context.characterId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  switch (name) {
    // ──────────── help ────────────
    case "help": {
      if (subcommand) {
        const cmdDef = COMMAND_MAP.get(subcommand);
        if (!cmdDef) {
          return { logs: [err(`알 수 없는 커맨드: ${subcommand}`)] };
        }
        return {
          logs: [
            sys(`━━ ${cmdDef.name.toUpperCase()} ━━`),
            info(`문법: ${cmdDef.syntax}`),
            info(`설명: ${cmdDef.description}`),
            info(`예시:`),
            ...cmdDef.examples.map((ex) => info(`  ${ex}`)),
          ],
        };
      }

      const categories = ["common", "solo", "party", "raid", "pvp", "market", "shop"];
      const logs: LogLine[] = [sys("━━ STACKWORLD 커맨드 목록 ━━")];
      for (const cat of categories) {
        logs.push(sys(`[${cat.toUpperCase()}]`));
        for (const [, cmd] of COMMAND_MAP) {
          if (cmd.category === cat) {
            logs.push(info(`  ${cmd.syntax.padEnd(40)} - ${cmd.description}`));
          }
        }
      }
      return { logs };
    }

    // ──────────── status ────────────
    case "status": {
      const res = await callAPI("/api/commands", { action: "status" });
      if (!res.ok) return { logs: [err(res.error ?? "status 조회 실패")] };
      return {
        logs: formatStatus(res.data),
        data: res.data,
      };
    }

    // ──────────── mastery ────────────
    case "mastery": {
      const res = await callAPI("/api/commands", {
        action: "mastery",
        filter: subcommand ?? args[0],
      });
      if (!res.ok) return { logs: [err(res.error ?? "mastery 조회 실패")] };
      return { logs: formatMastery(res.data) };
    }

    // ──────────── devpower ────────────
    case "devpower": {
      const res = await callAPI("/api/commands", { action: "devpower" });
      if (!res.ok) return { logs: [err(res.error ?? "devpower 조회 실패")] };
      return { logs: formatDevpower(res.data) };
    }

    // ──────────── titles ────────────
    case "titles": {
      const res = await callAPI("/api/commands", { action: "titles" });
      if (!res.ok) return { logs: [err(res.error ?? "titles 조회 실패")] };
      return { logs: formatTitles(res.data) };
    }

    // ──────────── inventory ────────────
    case "inventory": {
      const res = await callAPI("/api/commands", { action: "inventory" });
      if (!res.ok) return { logs: [err(res.error ?? "inventory 조회 실패")] };
      return { logs: formatInventory(res.data) };
    }

    // ──────────── run ────────────
    case "run": {
      const tier = flags.tier ? parseInt(String(flags.tier)) : 1;

      if (subcommand === "start") {
        const res = await callAPI("/api/run-command", {
          action: "start",
          tier,
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "런 시작 실패")] };
        context.onStateUpdate?.();
        const r = res.data?.result as Record<string, unknown> | undefined;
        const resources = r?.resources as { time: number; risk: number; debt: number; quality: number } | undefined;
        const seedStr = (r?.seed as string | undefined)?.slice(-8) ?? "????????";
        return {
          logs: [
            sys(`┌${"─".repeat(46)}┐`),
            sys(`│  Tier ${tier}  │  Phase: PLAN  │  seed: ...${seedStr}  │`),
            sys(`└${"─".repeat(46)}┘`),
            ...(resources ? formatResourceBars(resources) : []),
            sys("─".repeat(48)),
            info("  draw          → 티켓 3장 무작위 뽑기 (추천)"),
            info("  tickets        → 현재 페이즈 전체 티켓 목록"),
            info("  event          → 랜덤 이벤트 발생"),
            sys("─".repeat(48)),
          ],
          autoRefresh: true,
        };
      }

      if (subcommand === "status") {
        const res = await callAPI("/api/commands", { action: "run_status" });
        if (!res.ok) return { logs: [err(res.error ?? "런 상태 조회 실패")] };
        return { logs: formatRunStatus(res.data) };
      }

      if (subcommand === "end") {
        if (!context.activeRunId) return { logs: [err("활성 런이 없습니다")] };
        const res = await callAPI("/api/run-command", {
          action: "end",
          run_id: context.activeRunId,
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "런 종료 실패")] };
        context.onStateUpdate?.();
        const endResult = res.data?.result as Record<string, unknown> | undefined;
        const bonusCr = endResult?.completion_bonus_credits as number | undefined;
        return {
          logs: [
            success(String(endResult?.message ?? "런 종료")),
            ...(bonusCr ? [info(`완주 보너스: +${bonusCr}cr (크레딧 획득)`)] : []),
          ],
          autoRefresh: true,
        };
      }

      return { logs: [err(`알 수 없는 run 서브커맨드: ${subcommand}. help run 참조`)] };
    }

    // ──────────── event ────────────
    case "event": {
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다. run start 먼저")] };
      const res = await callAPI("/api/run-command", {
        action: "event",
        run_id: context.activeRunId,
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) return { logs: [err(res.error ?? "이벤트 발생 실패")] };
      const evData = res.data?.result as Record<string, unknown> | undefined;
      const choices = (evData?.choices ?? []) as Array<{ label: string; description?: string }>;
      const interactiveLog: LogLine = {
        timestamp: new Date().toISOString(),
        level: "interactive",
        message: "이벤트 선택지",
        data: {
          type: "choices",
          items: choices.map((c, i) => ({
            label: c.label,
            command: `choose ${i}`,
            meta: c.description,
            key: String(i),
          })),
        },
      };
      return {
        logs: [...formatEventCard(evData ?? {}), interactiveLog],
        quickMode: {
          hint: `0/1/2로 선택 — ${String(evData?.title ?? "")}`,
          map: Object.fromEntries(choices.map((_, i) => [String(i), `choose ${i}`])),
        },
      };
    }

    // ──────────── choose ────────────
    case "choose": {
      const choiceIndex = parseInt(subcommand ?? args[0] ?? "0");
      if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex > 2) {
        return { logs: [err("선택지 번호는 0, 1, 2 중 하나여야 합니다")] };
      }
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다")] };
      const res = await callAPI("/api/run-command", {
        action: "choose",
        run_id: context.activeRunId,
        choice_index: choiceIndex,
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) return { logs: [err(res.error ?? "선택 실패")] };
      const r = res.data?.result as Record<string, unknown> | undefined;
      const dt = r?.delta as Record<string, number> | undefined;
      const resources = r?.resources as { time: number; risk: number; debt: number; quality: number } | undefined;
      const tSign = (dt?.time ?? 0) >= 0 ? "+" : "";
      const rSign = (dt?.risk ?? 0) >= 0 ? "+" : "";
      const dSign = (dt?.debt ?? 0) >= 0 ? "+" : "";
      const qSign = (dt?.quality ?? 0) >= 0 ? "+" : "";
      return {
        logs: [
          success(`[선택] ${r?.choice}`),
          info(`변화: TIME${tSign}${dt?.time}  RISK${rSign}${dt?.risk}  DEBT${dSign}${dt?.debt}  QUAL${qSign}${dt?.quality}`),
          ...(resources ? formatResourceBars(resources) : []),
        ],
        autoRefresh: true,
      };
    }

    // ──────────── tickets ────────────
    case "tickets": {
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다. run start 먼저")] };
      const phaseArg = subcommand ?? args[0] ?? null;
      const res = await callAPI("/api/commands", {
        action: "tickets",
        ...(phaseArg ? { phase: phaseArg } : {}),
      });
      if (!res.ok) return { logs: [err(res.error ?? "티켓 목록 조회 실패")] };
      return { logs: formatTicketList(res.data) };
    }

    // ──────────── draw ────────────
    case "draw": {
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다. run start 먼저")] };
      const res = await callAPI("/api/run-command", {
        action: "draw",
        run_id: context.activeRunId,
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) return { logs: [err(res.error ?? "드로우 실패")] };
      const drawResult = res.data?.result as Record<string, unknown> | undefined;

      // 드로우 결과에 포함된 런 상태 표시
      const drawStreak = Number(drawResult?.current_streak ?? 0);
      const drawEffects = (drawResult?.active_effects ?? []) as ActiveEffect[];
      const drawRisk = (drawResult?.resources as Record<string, number> | undefined)?.risk ?? 0;
      const drawResources = drawResult?.resources as { time: number; risk: number; debt: number; quality: number } | undefined;

      const preLogs: LogLine[] = [];
      if (drawResources) preLogs.push(...formatResourceBars(drawResources));
      if (drawStreak >= 2) preLogs.push(...formatStreakBadge(drawStreak, []));
      if (drawRisk >= 50) preLogs.push(...formatRiskDangerZone(drawRisk));
      if (drawEffects.length > 0) preLogs.push(...formatActiveEffects(drawEffects));

      const hand = (drawResult?.hand ?? []) as Array<{
        ticket_key: string;
        title: string;
        position_tag: string;
        base_time_cost: number;
        base_risk_delta: number;
        base_quality_delta: number;
      }>;
      const drawLabels = ["A", "B", "C"];
      const drawInteractive: LogLine = {
        timestamp: new Date().toISOString(),
        level: "interactive",
        message: "티켓 선택",
        data: {
          type: "cards",
          items: hand.map((ticket, i) => {
            const rdStr = ticket.base_risk_delta >= 0 ? `+${ticket.base_risk_delta}` : String(ticket.base_risk_delta);
            const qdStr = ticket.base_quality_delta >= 0 ? `+${ticket.base_quality_delta}` : String(ticket.base_quality_delta);
            return {
              label: ticket.title,
              command: `work ${ticket.ticket_key}`,
              meta: `TIME:-${ticket.base_time_cost}  RISK:${rdStr}  QUAL:${qdStr}`,
              badge: ticket.position_tag,
              key: drawLabels[i],
            };
          }),
        },
      };
      return {
        logs: [...preLogs, ...formatDrawHand(drawResult), drawInteractive],
        quickMode: {
          hint: `A/B/C로 티켓 선택 (phase: ${String(drawResult?.phase ?? "")})`,
          map: Object.fromEntries(
            hand.map((ticket, i) => [drawLabels[i], `work ${ticket.ticket_key}`]),
          ),
        },
      };
    }

    // ──────────── work ────────────
    case "work": {
      const ticketKey = subcommand ?? args[0];
      if (!ticketKey) return { logs: [err("ticket_key를 입력하세요. 예: work PLAN_FE_001")] };
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다")] };
      const res = await callAPI("/api/run-command", {
        action: "work",
        run_id: context.activeRunId,
        ticket_key: ticketKey.toUpperCase(),
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) return { logs: [err(res.error ?? "티켓 처리 실패")] };
      const r = res.data?.result as Record<string, unknown> | undefined;

      const roll = parseFloat(String(r?.roll ?? "0"));
      const threshold = parseFloat(String(r?.threshold ?? "0"));
      const isCritical = Boolean(r?.critical);
      const isFumble = Boolean(r?.fumble);
      const isSuccess = Boolean(r?.success);
      const guaranteedConsumed = Boolean(r?.guaranteed_critical_consumed);
      const resources = r?.resources as { time: number; risk: number; debt: number; quality: number } | undefined;
      const streak = Number(r?.streak ?? 0);
      const streakMessages = (r?.streak_messages ?? []) as string[];
      const positionSynergy = r?.position_synergy as string | null;
      const activeEffects = (r?.active_effects ?? []) as ActiveEffect[];
      const newEffects = (r?.new_effects ?? []) as ActiveEffect[];
      const incident = r?.incident as { time_delta: number; risk_delta: number; message: string } | null;
      const xpMultiplier = Number(r?.xp_multiplier ?? 1.0);

      const logs: LogLine[] = [];

      // ── 보증 크리티컬 소모 알림 ──
      if (guaranteedConsumed) {
        logs.push(sys("  [★ GUARANTEED CRITICAL 발동!]"));
      }

      // ── 주사위 바 ──
      logs.push(formatRollBar(roll, threshold, isSuccess, isCritical, isFumble));

      // ── 결과 배너 ──
      if (isCritical) {
        logs.push(sys("╔════════════════════════════╗"));
        logs.push(success("║  ★★ CRITICAL HIT! ★★      ║"));
        logs.push(sys("╚════════════════════════════╝"));
      } else if (isFumble) {
        logs.push(sys("╔════════════════════════════╗"));
        logs.push(err("║  ✗✗ FUMBLE! ✗✗             ║"));
        logs.push(sys("╚════════════════════════════╝"));
      } else {
        logs.push(isSuccess ? success(String(r?.message ?? "")) : warn(String(r?.message ?? "")));
      }

      // ── RISK 위기 사고 ──
      if (incident) {
        logs.push(sys("╔══════════════════════════════════════════╗"));
        logs.push(err(`║  ⚠ RISK INCIDENT!  ${incident.message.slice(0, 22).padEnd(22)}║`));
        logs.push(err(`║  TIME${String(incident.time_delta).padStart(4)}  RISK+${String(incident.risk_delta).padEnd(2)}                    ║`));
        logs.push(sys("╚══════════════════════════════════════════╝"));
      }

      // ── 자원 바 ──
      if (resources) logs.push(...formatResourceBars(resources));

      // ── 스트릭 배지 ──
      if (streak >= 2) logs.push(...formatStreakBadge(streak, streakMessages));

      // ── 포지션 시너지 ──
      if (positionSynergy) logs.push(success(`  ${positionSynergy}`));

      // ── XP 정보 ──
      if (r?.xp_granted) {
        const multStr = xpMultiplier > 1.0 ? `  (x${xpMultiplier} STREAK 보너스)` : "";
        logs.push(success(`XP 획득: ${JSON.stringify(r.xp_granted)}${multStr}`));
      }

      // ── 신규 효과 알림 ──
      if (newEffects.length > 0) {
        const NEW_EFFECT_LABEL: Record<string, string> = {
          flow_state:          "→ FLOW STATE 진입! 성공률 ↑ (3턴)",
          tired:               "→ TIRED 부여 fumble 위험 ↑ (2턴)",
          focused:             "→ FOCUSED! QUAL +5/turn (3턴)",
          guaranteed_critical: "→ 다음 work 자동 CRITICAL 예약!",
        };
        for (const e of newEffects) {
          const label = NEW_EFFECT_LABEL[e.type] ?? `→ ${e.type}`;
          const colorFn = e.type === "tired" ? warn : e.type === "guaranteed_critical" ? sys : success;
          logs.push(colorFn(`  ${label}`));
        }
      }

      // ── 활성 효과 패널 ──
      if (activeEffects.length > 0) logs.push(...formatActiveEffects(activeEffects));

      // ── 페이즈 진행 배너 ──
      if (r?.phase_advanced && r?.new_phase) {
        logs.push(...formatPhaseBanner(String(r.old_phase ?? ""), String(r.new_phase)));
      }
      if (r?.auto_completed) {
        context.onStateUpdate?.();
        logs.push(success("★ 모든 페이즈 클리어! 런 자동 완료"));
      }

      return { logs, autoRefresh: true };
    }

    // ──────────── craft ────────────
    case "craft": {
      const artifactKey = subcommand ?? args[0];
      if (!artifactKey) return { logs: [err("artifact_key를 입력하세요")] };
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다")] };
      const res = await callAPI("/api/run-command", {
        action: "craft",
        run_id: context.activeRunId,
        artifact_key: artifactKey,
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) return { logs: [err(res.error ?? "제작 실패")] };
      return { logs: [success(res.data?.result?.message)] };
    }

    // ──────────── party ────────────
    case "party": {
      const res = await callAPI("/api/commands", {
        action: `party_${subcommand}`,
        code: args[0],
      });
      if (!res.ok) return { logs: [err(res.error ?? "파티 커맨드 실패")] };
      return { logs: [info(JSON.stringify(res.data))] };
    }

    // ──────────── raid ────────────
    case "raid": {
      if (subcommand === "start") {
        const mode = (flags.mode as string) ?? "incident";
        const tier = flags.tier ? parseInt(String(flags.tier)) : 1;
        const scenarioKey = (flags.scenario as string) ?? (mode === "incident" ? "PAYMENT_OUTAGE" : "GRAND_LAUNCH");

        // 파티 확인 — 없으면 솔로 파티 자동 생성
        const partyCheck = await callAPI("/api/commands", { action: "get_party" });
        let partyId = partyCheck.data?.party_id as string | null;
        const existingMemberCount = (partyCheck.data?.member_count as number | undefined) ?? 0;

        const prologLogs: ReturnType<typeof sys>[] = [];

        if (!partyId) {
          const createRes = await callAPI("/api/commands", { action: "party_create" });
          if (!createRes.ok) return { logs: [err(createRes.error ?? "파티 자동 생성 실패")] };
          partyId = createRes.data?.party_id as string;
          prologLogs.push(sys("솔로 파티 자동 생성 → 즉시 시작"));
        }

        // 혼자 있으면 solo: true (즉시 시작), 2명 이상 파티면 기존 3인 대기 흐름
        const isSolo = existingMemberCount <= 1;

        const raidRes = await callAPI("/api/raid-command", {
          action: "join",
          party_id: partyId,
          scenario_key: scenarioKey,
          mode,
          tier,
          solo: isSolo,
          idempotency_key: idempotencyKey,
        });
        if (!raidRes.ok) return { logs: [err(raidRes.error ?? "레이드 참여 실패")] };
        context.onStateUpdate?.();
        return {
          logs: [
            ...prologLogs,
            success(raidRes.data?.result?.message),
            info(`레이드 ID: ${raidRes.data?.result?.raid_id}`),
          ],
        };
      }

      if (subcommand === "action") {
        const actionKey = args[0];
        if (!actionKey) return { logs: [err("action_key를 입력하세요. 예: raid action trace")] };
        if (!context.activeRaidId) return { logs: [err("활성 레이드가 없습니다")] };
        const res = await callAPI("/api/raid-command", {
          action: "action",
          raid_id: context.activeRaidId,
          action_key: actionKey,
          args: {},
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "레이드 액션 실패")] };
        const r = res.data?.result as Record<string, unknown> | undefined;
        const kpi = r?.kpi as Record<string, number> | undefined;
        const isVictory = r?.victory as boolean | undefined;

        // 레이드 승리 → 파티 자동 탈퇴 + 상태 갱신
        if (isVictory) {
          await callAPI("/api/commands", { action: "party_leave" });
          context.onStateUpdate?.();
        }

        return {
          logs: [
            info(String(r?.message ?? "")),
            ...(kpi ? formatKPIDisplay(kpi) : []),
            ...(isVictory ? [success("★ 레이드 클리어! 파티를 자동 해산합니다."), sys("──────────────────────────────")] : []),
          ],
          autoRefresh: true,   // KPI + 레이드 상태 즉시 반영
        };
      }

      if (subcommand === "status") {
        const res = await callAPI("/api/commands", { action: "raid_status" });
        if (!res.ok) return { logs: [err(res.error ?? "레이드 상태 조회 실패")] };
        return { logs: formatRaidStatus(res.data) };
      }

      if (subcommand === "log") {
        const res = await callAPI("/api/commands", { action: "raid_log", raid_id: context.activeRaidId });
        if (!res.ok) return { logs: [err(res.error ?? "레이드 로그 조회 실패")] };
        return { logs: formatRaidLog(res.data) };
      }

      if (subcommand === "leave") {
        if (!context.activeRaidId) return { logs: [err("활성 레이드가 없습니다")] };

        // 1. 레이드 포기 (failed 처리)
        const abandonRes = await callAPI("/api/raid-command", {
          action: "abandon",
          raid_id: context.activeRaidId,
          idempotency_key: idempotencyKey,
        });

        // 2. 파티 탈퇴
        await callAPI("/api/commands", { action: "party_leave" });

        context.onStateUpdate?.();
        return {
          logs: [
            abandonRes.ok
              ? success("레이드를 포기하고 파티에서 나왔습니다")
              : warn("레이드 포기 처리 중 오류 (파티는 탈퇴됨)"),
          ],
          autoRefresh: true,
        };
      }

      return { logs: [err(`알 수 없는 raid 서브커맨드: ${subcommand}. help raid 참조`)] };
    }

    // ──────────── pvp ────────────
    case "pvp": {
      const mode = (flags.mode as string) ?? "golf";
      const tier = flags.tier ? parseInt(String(flags.tier)) : 1;

      if (subcommand === "queue") {
        const res = await callAPI("/api/pvp-submit", { action: "queue", mode, tier });
        if (!res.ok) return { logs: [err(res.error ?? "PvP 큐 참여 실패")] };
        return { logs: [info(JSON.stringify(res.data))] };
      }

      if (subcommand === "submit") {
        if (!context.activeRunId) return { logs: [err("제출할 런이 없습니다")] };
        const res = await callAPI("/api/pvp-submit", {
          action: "submit",
          run_id: context.activeRunId,
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "PvP 제출 실패")] };
        return { logs: [success(`점수: ${res.data?.result?.score}`)] };
      }

      return { logs: [err(`알 수 없는 pvp 서브커맨드: ${subcommand}`)] };
    }

    // ──────────── market ────────────
    case "market": {
      if (subcommand === "list") {
        const res = await callAPI("/api/commands", { action: "market_list", filter: args[0] });
        if (!res.ok) return { logs: [err(res.error ?? "마켓 조회 실패")] };
        return { logs: formatMarketList(res.data) };
      }
      if (subcommand === "sell") {
        const [artifactKey, qtyStr, priceStr] = args;
        if (!artifactKey || !qtyStr || !priceStr) {
          return { logs: [err("사용법: market sell <artifact_key> <qty> <price>")] };
        }
        const res = await callAPI("/api/market-trade", {
          action: "sell",
          artifact_key: artifactKey,
          qty: parseInt(qtyStr),
          price_credits: parseInt(priceStr),
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "판매 등록 실패")] };
        return { logs: [success(res.data?.result?.message)] };
      }
      if (subcommand === "buy") {
        const listingId = args[0];
        if (!listingId) return { logs: [err("listing_id를 입력하세요")] };
        const res = await callAPI("/api/market-trade", {
          action: "buy",
          listing_id: listingId,
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "구매 실패")] };
        return { logs: [success(res.data?.result?.message)] };
      }
      return { logs: [err("사용법: market list|sell|buy")] };
    }

    // ──────────── contract ────────────
    case "contract": {
      const res = await callAPI("/api/commands", { action: "contract_list" });
      if (!res.ok) return { logs: [err(res.error ?? "계약 조회 실패")] };
      return { logs: formatContractList(res.data) };
    }

    // ──────────── deliver ────────────
    case "deliver": {
      const contractId = subcommand ?? args[0];
      if (!contractId) return { logs: [err("contract_id를 입력하세요")] };
      const res = await callAPI("/api/market-trade", {
        action: "deliver",
        contract_id: contractId,
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) return { logs: [err(res.error ?? "납품 실패")] };
      return { logs: [success(res.data?.result?.message)] };
    }

    // ──────────── shop ────────────
    case "shop": {
      if (!subcommand || subcommand === "list") {
        return {
          logs: [sys("── SHOP 패널을 열었습니다 (우측 탭 확인) ──")],
          data: { openShop: true },
        };
      }
      if (subcommand === "buy") {
        const itemKey = args[0];
        if (!itemKey) return { logs: [err("사용법: shop buy <item_key>")] };
        const res = await callAPI("/api/shop-command", {
          action: "buy",
          item_key: itemKey.toUpperCase(),
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "구매 실패")] };
        const r = res.data?.result as Record<string, unknown> | undefined;
        return {
          logs: [
            success(String(r?.message ?? "구매 완료")),
            info(`잔여 크레딧: ${r?.credits_remaining}cr`),
            ...(r?.new_level ? [info(`현재 레벨: ${r.new_level}`)] : []),
          ],
          data: { openShop: true },
          autoRefresh: true,
        };
      }
      if (subcommand === "use") {
        const itemKey = args[0];
        if (!itemKey) return { logs: [err("사용법: shop use <item_key>")] };
        if (!context.activeRunId) return { logs: [err("활성 런이 없습니다. 소모품은 런 중에만 사용 가능합니다")] };
        const res = await callAPI("/api/shop-command", {
          action: "use",
          item_key: itemKey.toUpperCase(),
        });
        if (!res.ok) return { logs: [err(res.error ?? "아이템 사용 실패")] };
        const r = res.data?.result as Record<string, unknown> | undefined;
        const resources = r?.resources as { time: number; risk: number; debt: number; quality: number } | undefined;
        return {
          logs: [
            success(String(r?.message ?? "사용 완료")),
            ...(resources ? formatResourceBars(resources) : []),
          ],
          autoRefresh: true,
        };
      }
      if (subcommand === "equip") {
        const itemKey = args[0];
        if (!itemKey) return { logs: [err("사용법: shop equip <item_key>")] };
        const res = await callAPI("/api/shop-command", {
          action: "equip",
          item_key: itemKey.toUpperCase(),
        });
        if (!res.ok) return { logs: [err(res.error ?? "장착 실패")] };
        return {
          logs: [success(res.data?.result?.message ?? "장착 완료")],
          data: { openShop: true },
        };
      }
      if (subcommand === "unequip") {
        const res = await callAPI("/api/shop-command", { action: "unequip" });
        if (!res.ok) return { logs: [err(res.error ?? "해제 실패")] };
        return { logs: [success(res.data?.result?.message ?? "해제 완료")] };
      }
      return { logs: [err("사용법: shop list|buy|use|equip|unequip")] };
    }

    // ──────────── refactor (스킬) ────────────
    case "refactor": {
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다")] };
      const res = await callAPI("/api/shop-command", {
        action: "skill",
        skill_key: "SKILL_REFACTOR",
      });
      if (!res.ok) return { logs: [err(res.error ?? "refactor 실패")] };
      const r = res.data?.result as Record<string, unknown> | undefined;
      const resources = r?.resources as { time: number; risk: number; debt: number; quality: number } | undefined;
      return {
        logs: [
          success(String(r?.message ?? "리팩터링 완료")),
          info(`쿨다운: ${r?.cooldown_seconds}초`),
          ...(resources ? formatResourceBars(resources) : []),
        ],
        autoRefresh: true,
      };
    }

    // ──────────── code_review (스킬) ────────────
    case "code_review": {
      if (!context.activeRunId) return { logs: [err("활성 런이 없습니다")] };
      const res = await callAPI("/api/shop-command", {
        action: "skill",
        skill_key: "SKILL_CODE_REVIEW",
      });
      if (!res.ok) return { logs: [err(res.error ?? "code_review 실패")] };
      const r = res.data?.result as Record<string, unknown> | undefined;
      const resources = r?.resources as { time: number; risk: number; debt: number; quality: number } | undefined;
      return {
        logs: [
          success(String(r?.message ?? "코드 리뷰 완료")),
          info(`쿨다운: ${r?.cooldown_seconds}초`),
          ...(resources ? formatResourceBars(resources) : []),
        ],
        autoRefresh: true,
      };
    }

    default:
      return {
        logs: [err(`알 수 없는 커맨드: '${name}'. 'help'로 커맨드 목록을 확인하세요`)],
      };
  }
}

// ──────────── API 호출 헬퍼 ────────────
async function callAPI(path: string, body: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data, error: data?.error as string | undefined };
}

// ──────────── 로그 포맷터 ────────────
function log(level: LogLine["level"], message: string): LogLine {
  return { timestamp: new Date().toISOString(), level, message };
}
const info = (msg: string) => log("info", msg);
const success = (msg: string) => log("success", msg);
const warn = (msg: string) => log("warn", msg);
const err = (msg: string) => log("error", msg);
const sys = (msg: string) => log("system", msg);

// ──────────── 로컬 타입 ────────────
type ActiveEffect = { type: string; magnitude: number; turns_left: number };

// ──────────── UI 헬퍼: ASCII 바 ────────────

function bar(value: number, max: number, width = 10): string {
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function formatResourceBars(r: { time: number; risk: number; debt: number; quality: number }): LogLine[] {
  return [
    info(`TIME  [${bar(r.time, 100)}] ${String(r.time).padStart(3)}  RISK  [${bar(r.risk, 100)}] ${String(r.risk).padStart(3)}`),
    info(`QUAL  [${bar(r.quality, 100)}] ${String(r.quality).padStart(3)}  DEBT  [${bar(r.debt, 50)}]  ${String(r.debt).padStart(2)}`),
  ];
}

function formatRollBar(
  roll: number,
  threshold: number,
  isSuccess: boolean,
  isCritical: boolean,
  isFumble: boolean,
): LogLine {
  return {
    timestamp: new Date().toISOString(),
    level: "roll",
    message: "",
    data: { roll, threshold, isCritical, isFumble, isSuccess },
  };
}

function formatEventCard(data: Record<string, unknown>): LogLine[] {
  const title = String(data.title ?? "");
  const description = String(data.description ?? "");
  const severity = Number(data.severity ?? 1);
  const choices = (data.choices ?? []) as Array<{ label: string; description?: string }>;
  const hr = "─".repeat(48);
  return [
    sys(`┌${hr}┐`),
    sys(`│  ⚡ ${title}  [${severity}★]`),
    sys(`├${hr}┤`),
    info(`│  ${description}`),
    sys(`├${hr}┤`),
    ...choices.map((c, i) => info(`│  [${i}] ${c.label}`)),
    sys(`└${hr}┘`),
    info(`choose <0|1|2> 로 선택하세요`),
  ];
}

function formatDrawHand(data: Record<string, unknown> | undefined): LogLine[] {
  if (!data) return [err("드로우 데이터 없음")];
  const phase = String(data.phase ?? "");
  const hand = (data.hand ?? []) as Array<{
    ticket_key: string;
    title: string;
    position_tag: string;
    base_time_cost: number;
    base_risk_delta: number;
    base_quality_delta: number;
  }>;
  const labels = ["A", "B", "C"];
  const hr = "─".repeat(52);
  const headerLabel = `TICKET HAND (phase: ${phase})`;
  const headerPad = Math.max(0, 52 - 4 - headerLabel.length);
  const lines: LogLine[] = [
    sys(`┌── ${headerLabel} ${"─".repeat(headerPad)}┐`),
  ];
  hand.forEach((ticket, i) => {
    const rdStr = ticket.base_risk_delta >= 0 ? `+${ticket.base_risk_delta}` : String(ticket.base_risk_delta);
    const qdStr = ticket.base_quality_delta >= 0 ? `+${ticket.base_quality_delta}` : String(ticket.base_quality_delta);
    lines.push(info(`│  [${labels[i]}] ${ticket.ticket_key.padEnd(16)} ${ticket.title}`));
    lines.push(info(`│      TIME:-${ticket.base_time_cost}  RISK:${rdStr}  QUAL:${qdStr}  [${ticket.position_tag}]`));
    if (i < hand.length - 1) lines.push(sys(`├${hr}┤`));
  });
  lines.push(sys(`└${hr}┘`));
  lines.push(info(`work <ticket_key> 로 티켓 처리 시작`));
  return lines;
}

function formatPhaseBanner(from: string, to: string): LogLine[] {
  const fromU = from.toUpperCase();
  const toU = to.toUpperCase();
  const arrow = ` ──────────→ `;
  const inner = `    ${fromU}${arrow}${toU}`;
  const width = Math.max(46, inner.length + 4);
  const hr = "═".repeat(width);
  const pad = (s: string) => s.padEnd(width - 2);
  return [
    sys(`╔${hr}╗`),
    sys(`║  ${pad("★ PHASE COMPLETE!")}║`),
    sys(`║  ${pad(inner)}║`),
    sys(`╚${hr}╝`),
  ];
}

function formatKPIDisplay(kpi: Record<string, number>): LogLine[] {
  const lines: LogLine[] = [sys("── KPI ──────────────────────────────────────")];
  if (kpi.error_rate !== undefined) {
    lines.push(info(`ERROR_RATE  [${bar(kpi.error_rate, 100)}] ${kpi.error_rate.toFixed(1)}%`));
  }
  if (kpi.success_rate !== undefined) {
    lines.push(info(`SUCC_RATE   [${bar(kpi.success_rate, 100)}] ${kpi.success_rate.toFixed(1)}%`));
  }
  if (kpi.latency_p95 !== undefined) {
    lines.push(info(`P95_LATENCY [${bar(Math.min(kpi.latency_p95, 2000), 2000)}] ${kpi.latency_p95}ms`));
  }
  return lines;
}

function formatActiveEffects(effects: ActiveEffect[]): LogLine[] {
  if (!effects || effects.length === 0) return [];
  const LABELS: Record<string, string> = {
    flow_state:          "FLOW STATE         (성공률 ↑ +15%)",
    tired:               "TIRED              (fumble 위험 ↑ +5%)",
    focused:             "FOCUSED            (QUAL +5/turn)",
    guaranteed_critical: "GUARANTEED CRIT ★  (다음 work 자동 CRITICAL)",
  };
  const colorOf = (type: string) => {
    if (type === "tired") return warn;
    if (type === "guaranteed_critical") return sys;
    return success;
  };
  return [
    sys("── ACTIVE EFFECTS ──────────────────────────"),
    ...effects.map((e) => colorOf(e.type)(`  [${LABELS[e.type] ?? e.type}]  残 ${e.turns_left}턴`)),
  ];
}

function formatStreakBadge(streak: number, streakMessages: string[]): LogLine[] {
  if (streak < 2) return [];
  const badge =
    streak >= 10 ? `★★★ UNSTOPPABLE  STREAK x${streak} ★★★` :
    streak >= 5  ? `★★ ON FIRE!  STREAK x${streak} ★★` :
    streak >= 3  ? `★ STREAK x${streak}` :
                   `STREAK x${streak}`;
  const lines: LogLine[] = [success(`  ${badge}`)];
  for (const msg of streakMessages) lines.push(success(`  ${msg}`));
  return lines;
}

function formatRiskDangerZone(risk: number): LogLine[] {
  if (risk < 50) return [];
  const level =
    risk >= 90 ? err(`  ⚠ DANGER ZONE! RISK ${risk} — 사고 확률 20%`) :
    risk >= 70 ? warn(`  ⚠ HIGH RISK  RISK ${risk} — 사고 확률 8%`) :
                 warn(`  ⚠ RISK ${risk} — 사고 확률 3%`);
  return [level];
}

// ──────────── 기존 포맷터 ────────────

function formatStatus(data: Record<string, unknown> | undefined): LogLine[] {
  if (!data) return [err("상태 데이터 없음")];
  const char = data.character as Record<string, unknown>;
  const run = data.active_run as Record<string, unknown> | null;
  const logs: LogLine[] = [
    sys("━━ 캐릭터 상태 ━━"),
    info(`이름: ${char?.name}  크레딧: ${char?.credits}cr`),
  ];
  if (run) {
    const resources = {
      time: Number(run.time),
      risk: Number(run.risk),
      debt: Number(run.debt),
      quality: Number(run.quality),
    };
    logs.push(sys("━━ 활성 런 ━━"));
    logs.push(info(`페이즈: ${run.phase}  상태: ${run.status}`));
    logs.push(...formatResourceBars(resources));
  } else {
    logs.push(info("활성 런 없음 (run start로 시작)"));
  }
  return logs;
}

function formatMastery(data: Record<string, unknown> | undefined): LogLine[] {
  if (!data) return [err("숙련 데이터 없음")];
  const pos = (data.position ?? []) as Array<{ position: string; level: number; xp: number }>;
  const core = (data.core ?? []) as Array<{ core: string; level: number; xp: number }>;
  return [
    sys("━━ 포지션 숙련 ━━"),
    ...pos.map((p) => info(`  ${p.position.padEnd(8)} Lv.${String(p.level).padStart(3)}  XP: ${p.xp}`)),
    sys("━━ 공통 역량 ━━"),
    ...core.map((c) => info(`  ${c.core.padEnd(20)} Lv.${String(c.level).padStart(3)}  XP: ${c.xp}`)),
  ];
}

function formatDevpower(data: Record<string, unknown> | undefined): LogLine[] {
  if (!data) return [err("DevPower 데이터 없음")];
  return [
    sys("━━ DevPower 분석 ━━"),
    success(`DEVPOWER: ${data.devpower}`),
    info(`RELIABILITY: ${data.reliability}`),
    info(`THROUGHPUT: ${data.throughput}`),
  ];
}

function formatTitles(data: Record<string, unknown> | undefined): LogLine[] {
  const titles = (data?.titles ?? []) as Array<{ title_key: string; earned_at: string }>;
  if (titles.length === 0) return [info("획득한 타이틀이 없습니다")];
  return [
    sys("━━ 타이틀 목록 ━━"),
    ...titles.map((t) => info(`  [${t.title_key}] 획득: ${t.earned_at.split("T")[0]}`)),
  ];
}

function formatInventory(data: Record<string, unknown> | undefined): LogLine[] {
  const items = (data?.inventory ?? []) as Array<{ artifact_key: string; qty: number }>;
  if (items.length === 0) return [info("인벤토리가 비어있습니다")];
  return [
    sys("━━ 인벤토리 ━━"),
    ...items.map((i) => info(`  ${i.artifact_key.padEnd(30)} x${i.qty}`)),
  ];
}

function formatRunStatus(data: Record<string, unknown> | undefined): LogLine[] {
  if (!data?.run) return [info("활성 런이 없습니다")];
  const r = data.run as Record<string, unknown>;
  const resources = {
    time: Number(r.time),
    risk: Number(r.risk),
    debt: Number(r.debt),
    quality: Number(r.quality),
  };
  return [
    sys("━━ 런 상태 ━━"),
    info(`페이즈: ${r.phase}  티어: ${r.tier}`),
    ...formatResourceBars(resources),
    info(`커맨드 수: ${r.cmd_count}`),
  ];
}

function formatRaidStatus(data: Record<string, unknown> | undefined): LogLine[] {
  if (!data?.raid) return [info("활성 레이드가 없습니다")];
  const r = data.raid as Record<string, unknown>;
  const kpi = r.kpi as Record<string, number>;
  return [
    sys("━━ 레이드 상태 ━━"),
    info(`시나리오: ${r.scenario_key}  상태: ${r.status}`),
    ...formatKPIDisplay(kpi ?? {}),
    info(`목표: 에러율<${kpi?.target_error_rate}% 성공률>${kpi?.target_success_rate}%`),
  ];
}

function formatRaidLog(data: Record<string, unknown> | undefined): LogLine[] {
  const events = (data?.events ?? []) as Array<{ type: string; payload: Record<string, unknown>; created_at: string }>;
  return events.map((e) =>
    info(`[${e.created_at.split("T")[1].slice(0, 8)}] ${e.type}: ${JSON.stringify(e.payload).slice(0, 60)}`)
  );
}

function formatMarketList(data: Record<string, unknown> | undefined): LogLine[] {
  const listings = (data?.listings ?? []) as Array<{
    id: string;
    artifact_key: string;
    qty: number;
    price_credits: number;
  }>;
  if (listings.length === 0) return [info("마켓 리스팅이 없습니다")];
  return [
    sys("━━ 마켓 리스팅 ━━"),
    sys("ID(앞 8자리)           아티팩트                      수량   가격"),
    ...listings.map((l) =>
      info(`${l.id.slice(0, 8)}  ${l.artifact_key.padEnd(30)} x${String(l.qty).padEnd(4)} ${l.price_credits}cr`)
    ),
  ];
}

function formatShopList(data: Record<string, unknown> | undefined, typeFilter: string | null): LogLine[] {
  if (!data) return [err("상점 데이터 없음")];
  const credits = Number(data.credits ?? 0);
  const queued = data.queued_modifier as string | null;
  const items = (data.items ?? []) as Array<{
    item_key: string;
    item_type: string;
    name: string;
    description: string;
    price: number;
    max_level: number;
    rarity: string;
    owned_level: number | null;
    owned_qty: number;
  }>;

  const TYPE_ORDER = ["upgrade", "consumable", "skill", "modifier"];
  const TYPE_LABEL: Record<string, string> = {
    upgrade: "★ 영구 업그레이드", consumable: "✦ 소모품",
    skill: "✧ 스킬 언락", modifier: "◈ 런 수식어",
  };
  const RARITY_COLOR: Record<string, string> = {
    common: "", rare: " [R]", epic: " [E]", legendary: " [L]",
  };

  const filtered = typeFilter
    ? items.filter((i) => i.item_type === typeFilter)
    : items;

  const byType = TYPE_ORDER.map((type) => ({
    type,
    items: filtered.filter((i) => i.item_type === type),
  })).filter((g) => g.items.length > 0);

  const lines: LogLine[] = [
    sys(`━━ STACKWORLD 상점  │  보유 크레딧: ${credits}cr ${queued ? `│ 장착: ${queued}` : ""} ━━`),
    info(`shop buy <item_key> 로 구매 / shop use <item_key> 로 소모품 사용`),
    sys("─".repeat(66)),
  ];
  for (const group of byType) {
    lines.push(sys(TYPE_LABEL[group.type]));
    for (const item of group.items) {
      const owned =
        item.owned_level != null ? ` [Lv.${item.owned_level}/${item.max_level}]` :
        item.owned_qty > 0 ? ` [x${item.owned_qty}]` : "";
      const r = RARITY_COLOR[item.rarity] ?? "";
      lines.push(info(`  ${item.item_key.padEnd(24)} ${item.name}${r}${owned}`));
      lines.push(info(`    ${item.description.slice(0, 54)}  ${item.price}cr`));
    }
  }
  return lines;
}

function formatTicketList(data: Record<string, unknown> | undefined): LogLine[] {
  if (!data) return [err("티켓 데이터 없음")];
  const phase = String(data.phase ?? "").toUpperCase();
  const tickets = (data.tickets ?? []) as Array<{
    ticket_key: string;
    title: string;
    position_tag: string;
    base_time_cost: number;
    base_risk_delta: number;
    base_quality_delta: number;
    difficulty?: number;
  }>;
  if (tickets.length === 0) return [info(`${phase} 페이즈에 티켓이 없습니다`)];

  const lines: LogLine[] = [
    sys(`━━ TICKETS  [${phase} 페이즈]  총 ${tickets.length}개 ━━`),
    sys(`${"티켓 KEY".padEnd(20)} ${"포지션".padEnd(6)} ${"제목".padEnd(28)} TIME  RISK  QUAL`),
    sys("─".repeat(72)),
  ];

  // 포지션별 그룹 표시
  let lastPos = "";
  for (const t of tickets) {
    if (t.position_tag !== lastPos) {
      if (lastPos !== "") lines.push(sys("·".repeat(72)));
      lastPos = t.position_tag;
    }
    const rdStr = t.base_risk_delta >= 0 ? `+${t.base_risk_delta}` : String(t.base_risk_delta);
    const qdStr = t.base_quality_delta >= 0 ? `+${t.base_quality_delta}` : String(t.base_quality_delta);
    lines.push(info(
      `${t.ticket_key.padEnd(20)} ${t.position_tag.padEnd(6)} ${t.title.slice(0, 28).padEnd(28)}` +
      ` -${t.base_time_cost}   ${rdStr.padStart(3)}   ${qdStr.padStart(3)}`
    ));
  }
  lines.push(sys("─".repeat(72)));
  lines.push(info(`work <ticket_key>  또는  draw 로 랜덤 3장 뽑기`));
  return lines;
}

function formatContractList(data: Record<string, unknown> | undefined): LogLine[] {
  const contracts = (data?.contracts ?? []) as Array<{
    id: string;
    target_artifact_key: string;
    qty_required: number;
    reward_credits: number;
    expires_at: string;
  }>;
  if (contracts.length === 0) return [info("활성 계약이 없습니다")];
  return [
    sys("━━ 납품 계약 ━━"),
    sys("ID(앞 8자리)  아티팩트                      수량   보상    만료"),
    ...contracts.map((c) =>
      info(
        `${c.id.slice(0, 8)}  ${c.target_artifact_key.padEnd(30)} x${String(c.qty_required).padEnd(4)} ${String(c.reward_credits).padEnd(6)}cr ${c.expires_at.split("T")[0]}`,
      )
    ),
  ];
}
