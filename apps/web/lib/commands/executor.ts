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
    activePvpMatchId?: string;
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

      const categories = ["common", "solo", "party", "raid", "pvp", "market", "shop", "community"];
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
        // 동시 진행 방지: 레이드 중에는 솔로 런 불가
        if (context.activeRaidId) {
          return { logs: [err("레이드가 진행 중입니다. 먼저 레이드를 완료하거나 탈퇴하세요. (raid leave)")] };
        }
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
        const runId = r?.run_id as string | undefined;

        const startLogs: LogLine[] = [
          sys(`┌${"─".repeat(46)}┐`),
          sys(`│  Tier ${tier}  │  페이즈: 기획  │  seed: ...${seedStr}  │`),
          sys(`└${"─".repeat(46)}┘`),
          ...(resources ? formatResourceBars(resources) : []),
          sys("─".repeat(48)),
          info("  event          → 랜덤 이벤트 발생"),
          info("  tickets        → 현재 페이즈 전체 티켓 목록"),
          sys("─".repeat(48)),
        ];

        // 자동 draw
        if (runId) {
          const drawRes = await callAPI("/api/run-command", {
            action: "draw",
            run_id: runId,
            idempotency_key: `${context.characterId}-autodraw-start-${Date.now()}`,
          });
          if (drawRes.ok) {
            const dd = drawRes.data?.result as Record<string, unknown> | undefined;
            const drawHand = (dd?.hand ?? []) as DrawTicket[];
            const { interactive, quickMode } = buildDrawInteractive(drawHand, dd?.phase as string | undefined);
            return {
              logs: [...startLogs, ...formatDrawHand(dd), interactive],
              quickMode,
              autoRefresh: true,
            };
          }
        }
        return { logs: startLogs, autoRefresh: true };
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
      const choices = (evData?.choices ?? []) as Array<{ label: string; description?: string; risk_level?: string }>;
      const interactiveLog: LogLine = {
        timestamp: new Date().toISOString(),
        level: "interactive",
        message: "이벤트 선택지",
        data: {
          type: "choices",
          items: choices.map((c, i) => ({
            label: `${RISK_BADGE[c.risk_level ?? ""] ?? ""}  ${c.label}`,
            command: `choose ${i}`,
            meta: c.description,
            key: String(i),
          })),
        },
      };
      return {
        logs: [...formatEventCard(evData ?? {}), interactiveLog],
        quickMode: {
          hint: `0/1/2/3으로 선택 — ${String(evData?.title ?? "")}`,
          map: Object.fromEntries(choices.map((_, i) => [String(i), `choose ${i}`])),
        },
      };
    }

    // ──────────── choose ────────────
    case "choose": {
      const choiceIndex = parseInt(subcommand ?? args[0] ?? "0");
      if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex > 3) {
        return { logs: [err("선택지 번호는 0~3 중 하나여야 합니다")] };
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
      const rollData = r?.roll_data as Record<string, unknown> | undefined;
      const outcomeType = String(r?.outcome_type ?? "");
      const colorFn = outcomeType === "success" ? success : outcomeType === "partial" ? warn : err;
      const tSign = (dt?.time ?? 0) >= 0 ? "+" : "";
      const rSign = (dt?.risk ?? 0) >= 0 ? "+" : "";
      const dSign = (dt?.debt ?? 0) >= 0 ? "+" : "";
      const qSign = (dt?.quality ?? 0) >= 0 ? "+" : "";
      const rollLog: LogLine | null = rollData
        ? { timestamp: new Date().toISOString(), level: "roll", message: "이벤트 판정", data: rollData }
        : null;
      return {
        logs: [
          ...(rollLog ? [rollLog] : []),
          colorFn(`[${outcomeType.toUpperCase()}] ${r?.choice} → ${r?.outcome_label}`),
          info(`변화: 시간${tSign}${dt?.time}  위험${rSign}${dt?.risk}  부채${dSign}${dt?.debt}  품질${qSign}${dt?.quality}`),
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
      const { interactive: drawInteractive, quickMode: drawQuickMode } = buildDrawInteractive(hand, drawResult?.phase as string | undefined);
      return {
        logs: [...preLogs, ...formatDrawHand(drawResult), drawInteractive],
        quickMode: drawQuickMode,
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

      // ── 보장 치명타 소모 알림 ──
      if (guaranteedConsumed) {
        logs.push(sys("  [★ 보장 치명타 발동!]"));
      }

      // ── 주사위 바 ──
      logs.push(formatRollBar(roll, threshold, isSuccess, isCritical, isFumble));

      // ── 결과 배너 ──
      if (isCritical) {
        logs.push(sys("╔════════════════════════════╗"));
        logs.push(success("║  ★★  치명타!  ★★          ║"));
        logs.push(sys("╚════════════════════════════╝"));
      } else if (isFumble) {
        logs.push(sys("╔════════════════════════════╗"));
        logs.push(err("║  ✗✗  실수!  ✗✗             ║"));
        logs.push(sys("╚════════════════════════════╝"));
      } else {
        logs.push(isSuccess ? success(String(r?.message ?? "")) : warn(String(r?.message ?? "")));
      }

      // ── 위험 사고 ──
      if (incident) {
        logs.push(sys("╔══════════════════════════════════════════╗"));
        logs.push(err(`║  ⚠ 위험 사고!  ${incident.message.slice(0, 26).padEnd(26)}║`));
        logs.push(err(`║  시간${String(incident.time_delta).padStart(4)}  위험+${String(incident.risk_delta).padEnd(2)}                      ║`));
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
        const multStr = xpMultiplier > 1.0 ? `  (x${xpMultiplier} 연속 보너스)` : "";
        logs.push(success(`XP 획득: ${formatXPGrant(r.xp_granted as Record<string, unknown>)}${multStr}`));
      }

      // ── 신규 효과 알림 ──
      if (newEffects.length > 0) {
        const NEW_EFFECT_LABEL: Record<string, string> = {
          flow_state:          "→ 몰입 상태 진입! 성공률 ↑ (3턴)",
          tired:               "→ 피로 부여 실수 위험 ↑ (2턴)",
          focused:             "→ 집중! 품질 +5/턴 (3턴)",
          guaranteed_critical: "→ 다음 work 자동 치명타 예약!",
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
      // ── 부채 압박 경고 ──
      if (r?.debt_pressure) {
        logs.push(warn("  ⚠ 기술 부채 압박! 시간 -2 추가 소모 (부채 30+)"));
      }

      // ── 품질 위기 경고 ──
      if (r?.quality_crisis) {
        logs.push(warn("  ⚠ 코드 품질 위기! 품질 20 미만 — 성공률 하락 중"));
      }

      if (r?.phase_advanced && r?.new_phase) {
        logs.push(...formatPhaseBanner(String(r.old_phase ?? ""), String(r.new_phase)));
      }
      if (r?.auto_completed) {
        logs.push(success("★ 모든 페이즈 클리어! 런 자동 완료"));
        if (r?.completion_bonus_credits) {
          logs.push(info(`완주 보너스: +${r.completion_bonus_credits}cr 지급`));
        }
      }

      // 런이 계속 진행 중이면 자동 draw
      const runOver = r?.auto_completed ||
        (resources?.time ?? 1) <= 0 ||
        (resources?.risk ?? 0) >= 100;

      if (!runOver && context.activeRunId) {
        const drawRes = await callAPI("/api/run-command", {
          action: "draw",
          run_id: context.activeRunId,
          idempotency_key: `${context.characterId}-autodraw-work-${Date.now()}`,
        });
        if (drawRes.ok) {
          const dd = drawRes.data?.result as Record<string, unknown> | undefined;
          const drawHand = (dd?.hand ?? []) as DrawTicket[];
          const { interactive, quickMode } = buildDrawInteractive(drawHand, dd?.phase as string | undefined);
          return {
            logs: [...logs, sys("─".repeat(48)), ...formatDrawHand(dd), interactive],
            quickMode,
            autoRefresh: true,
          };
        }
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
      const pd = res.data as Record<string, unknown> | undefined;
      const partyLogs: LogLine[] = [];
      if (pd?.message) partyLogs.push(success(String(pd.message)));
      if (pd?.party_id)  partyLogs.push(info(`파티 ID: ${String(pd.party_id).slice(0, 8)}...`));
      if (pd?.code)      partyLogs.push(info(`파티 코드: ${pd.code}  (party join ${pd.code} 로 참여)`));
      if (pd?.member_count !== undefined) partyLogs.push(info(`파티원: ${pd.member_count}명`));
      if (!partyLogs.length) partyLogs.push(success(`파티 ${subcommand} 완료`));
      return { logs: partyLogs, autoRefresh: true };
    }

    // ──────────── raid ────────────
    case "raid": {
      if (subcommand === "start") {
        // 동시 진행 방지: 솔로 런 중에는 레이드 불가
        if (context.activeRunId) {
          return { logs: [err("솔로 런이 진행 중입니다. 먼저 런을 종료하세요. (run end)")] };
        }
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
        const joinResult = raidRes.data?.result as Record<string, unknown> | undefined;
        const joinActions = (joinResult?.available_actions ?? []) as RaidAction[];
        return {
          logs: [
            ...prologLogs,
            success(String(joinResult?.message ?? "레이드 시작")),
            info(`레이드 ID: ${String(joinResult?.raid_id ?? "")}`),
            ...formatRaidActionMenu(joinActions),
          ],
          quickMode: buildRaidQuickMode(joinActions),
          autoRefresh: true,
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
        const kpi = r?.kpi as Record<string, unknown> | undefined;
        const isVictory  = r?.victory     as boolean | undefined;
        const isCritical = r?.is_critical as boolean | undefined;
        const isBackfire = r?.is_backfire as boolean | undefined;
        const isCombo    = r?.is_combo    as boolean | undefined;
        const roll       = r?.roll        as number  | undefined;
        const nextActions = (r?.available_actions ?? []) as RaidAction[];
        const newlyFiredEvents = (r?.newly_fired_events ?? []) as Array<{
          title: string; description: string; severity: number;
        }>;

        // 레이드 승리 → 파티 자동 탈퇴 (onStateUpdate 제거 — autoRefresh로 일원화)
        if (isVictory) {
          await callAPI("/api/commands", { action: "party_leave" });
        }

        // 판정 롤 애니메이션 (치명타/역효과/성공)
        const rollLog: LogLine | null = roll !== undefined ? {
          timestamp: new Date().toISOString(),
          level: "roll",
          message: "레이드 판정",
          data: {
            roll,
            threshold: 0.85,           // crit 임계값
            isCritical: !!isCritical,
            isFumble:   !!isBackfire,
            isSuccess:  !isBackfire,
          },
        } : null;

        // 타임드 이벤트 로그 (심각도별 드라마틱 표시)
        const eventLogs: LogLine[] = [];
        for (const evt of newlyFiredEvents) {
          if (evt.severity >= 5) {
            // 긴급 이벤트 — 눈에 띄는 경계
            eventLogs.push(sys("╔══════════════ ⚡ 긴급 이벤트 ══════════════╗"));
            eventLogs.push({ timestamp: new Date().toISOString(), level: "error", message: `  ${evt.title}` });
            eventLogs.push({ timestamp: new Date().toISOString(), level: "warn",  message: `  ${evt.description}` });
            eventLogs.push(sys("╚═══════════════════════════════════════════╝"));
          } else if (evt.severity >= 4) {
            eventLogs.push({ timestamp: new Date().toISOString(), level: "error", message: `⚡ [이벤트] ${evt.title}` });
            eventLogs.push({ timestamp: new Date().toISOString(), level: "warn",  message: `   ${evt.description}` });
          } else if (evt.severity >= 3) {
            eventLogs.push({ timestamp: new Date().toISOString(), level: "warn",  message: `⚡ [이벤트] ${evt.title} — ${evt.description}` });
          } else {
            eventLogs.push({ timestamp: new Date().toISOString(), level: "info",  message: `○ [이벤트] ${evt.title} — ${evt.description}` });
          }
        }

        // 콤보 보너스 로그
        const comboLog: LogLine | null = isCombo
          ? { timestamp: new Date().toISOString(), level: "success", message: "🔗 콤보 연계! 효율 +30%" }
          : null;

        // 역효과 경고
        const backfireLog: LogLine | null = isBackfire
          ? { timestamp: new Date().toISOString(), level: "error", message: "💥 역효과! 조치가 상황을 악화시켰습니다!" }
          : null;

        // 치명적 성공 메시지
        const critLog: LogLine | null = isCritical
          ? { timestamp: new Date().toISOString(), level: "success", message: "⚡ 치명적 성공! 효율 2배!" }
          : null;

        // KPI display — 비공개 키(_cooldowns 등) 제외
        const publicKpi: Record<string, number> = {};
        if (kpi) {
          for (const [k, v] of Object.entries(kpi)) {
            if (!k.startsWith("_") && typeof v === "number") publicKpi[k] = v;
          }
        }

        const resultLogs: LogLine[] = [
          ...(rollLog ? [rollLog] : []),
          ...(backfireLog ? [backfireLog] : []),
          ...(critLog ? [critLog] : []),
          ...(comboLog ? [comboLog] : []),
          info(String(r?.message ?? "")),
          ...eventLogs,
          ...(Object.keys(publicKpi).length ? formatKPIDisplay(publicKpi) : []),
          ...(isVictory
            ? [
                success("★ 레이드 클리어! 파티를 자동 해산합니다."),
                ...(r?.victory_credits ? [info(`보상: +${r.victory_credits}cr 지급`)] : []),
                sys("──────────────────────────────"),
              ]
            : formatRaidActionMenu(nextActions)
          ),
        ];

        return {
          logs: resultLogs,
          quickMode: isVictory ? null : buildRaidQuickMode(nextActions),
          autoRefresh: true,
          data: isVictory ? { raidEnded: true } : undefined,
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

      // ── queue ──
      if (subcommand === "queue") {
        if (context.activePvpMatchId) {
          return { logs: [err("이미 PvP 매치가 진행 중입니다. pvp status 로 확인하세요.")] };
        }
        if (context.activeRunId) {
          return { logs: [err("솔로 런이 진행 중입니다. run end 후 pvp queue 하세요.")] };
        }
        if (context.activeRaidId) {
          return { logs: [err("레이드가 진행 중입니다. 레이드 종료 후 pvp queue 하세요.")] };
        }
        const res = await callAPI("/api/pvp-submit", { action: "queue", mode, tier });
        if (!res.ok) return { logs: [err(res.error ?? "PvP 큐 참여 실패")] };
        const qd = res.data as Record<string, unknown>;
        const matchId = String(qd.match_id ?? "");
        const matched = qd.matched as boolean;
        return {
          logs: [
            success(String(qd.message ?? `PvP 큐 등록 완료 (${mode} Tier ${tier})`)),
            info(`참여 인원: ${qd.participants ?? 1}명`),
            sys("─".repeat(48)),
            matched
              ? info("  상대방과 매칭되었습니다!")
              : info("  상대방 대기 중 — 솔로 플레이로도 점수 제출 가능합니다"),
            info("  ① run start  로 런을 시작하세요"),
            info("  ② 런 완료 후  pvp submit  으로 점수를 제출하세요"),
            sys("─".repeat(48)),
          ],
          data: { pvpMatchId: matchId },
        };
      }

      // ── submit ──
      if (subcommand === "submit") {
        if (!context.activePvpMatchId) return { logs: [err("진행 중인 PvP 매치가 없습니다. pvp queue 먼저 실행하세요.")] };
        if (!context.activeRunId)      return { logs: [err("완료된 런이 없습니다. run start → 런 진행 → run end 후 제출하세요.")] };
        const res = await callAPI("/api/pvp-submit", {
          action: "submit",
          match_id: context.activePvpMatchId,
          run_id:   context.activeRunId,
          idempotency_key: idempotencyKey,
        });
        if (!res.ok) return { logs: [err(res.error ?? "PvP 제출 실패")] };
        const r = res.data?.result as Record<string, unknown> | undefined;
        const score   = Number(r?.score   ?? 0);
        const bd      = r?.breakdown as Record<string, unknown> | undefined;
        const isGolf  = mode === "golf" || String(r?.mode) === "golf";
        const pvpCredits = r?.credits_earned as number | undefined;
        const luckBonus  = r?.luck_bonus as number | undefined;
        return {
          logs: [
            success(`★ PvP 제출 완료!`),
            info(`최종 점수: ${score}점`),
            ...(pvpCredits ? [info(`보상: +${pvpCredits}cr 지급`)] : []),
            ...(luckBonus !== undefined && luckBonus !== 0
              ? [luckBonus > 0
                  ? success(`운 보너스: +${luckBonus}pt (이벤트 성공)`)
                  : warn(`운 패널티: ${luckBonus}pt (이벤트 실패)`)]
              : []),
            sys("── 성적표 ─────────────────────────────────────"),
            isGolf
              ? info(`  커맨드 수: ${bd?.cmd_count}  품질: ${bd?.quality}  부채: ${bd?.debt}  시간: ${bd?.elapsed_sec}초`)
              : info(`  소요 시간: ${bd?.elapsed_sec}초  품질: ${bd?.quality}  부채: ${bd?.debt}`),
            sys(`  제출 ${r?.submitted_count}/${r?.total_entries}명`),
            r?.match_completed ? success("  모든 참여자 제출 완료 — 매치 종료!") : info("  상대방 제출 대기 중..."),
            sys("─".repeat(48)),
          ],
          data: { pvpEnded: true },
          autoRefresh: true,
        };
      }

      // ── status ──
      if (subcommand === "status") {
        const res = await callAPI("/api/pvp-submit", { action: "pvp_status" });
        if (!res.ok) return { logs: [err(res.error ?? "PvP 상태 조회 실패")] };
        const e = res.data?.entry as Record<string, unknown> | null;
        if (!e) return { logs: [info("진행 중인 PvP 매치가 없습니다.")] };
        const modeLabel = String(e.mode) === "golf" ? "Code Golf" : "Speedrun";
        const statusLabel: Record<string, string> = { queuing: "대기 중", active: "진행 중", completed: "종료" };
        return {
          logs: [
            sys("━━ PvP 매치 현황 ━━"),
            info(`모드: ${modeLabel}  Tier: ${e.tier}  상태: ${statusLabel[String(e.status)] ?? e.status}`),
            info(`참여: ${e.submitted_count}/${e.total_entries}명 제출`),
            e.my_score !== null
              ? success(`내 점수: ${e.my_score}점 (제출 완료)`)
              : info("아직 제출하지 않았습니다"),
          ],
        };
      }

      // ── leaderboard ──
      if (subcommand === "leaderboard") {
        const lbMode = (flags.mode as string) ?? "golf";
        const res = await callAPI("/api/pvp-submit", { action: "pvp_leaderboard", mode: lbMode });
        if (!res.ok) return { logs: [err(res.error ?? "리더보드 조회 실패")] };
        const rows = (res.data?.leaderboard ?? []) as Array<{
          rank: number; name: string; total_score: number; match_count: number;
        }>;
        const modeLabel = lbMode === "golf" ? "Code Golf" : "Speedrun";
        return {
          logs: [
            sys(`━━ PvP 리더보드 — ${modeLabel} [${res.data?.season ?? "현재 시즌"}] ━━`),
            sys(`  ${"순위".padEnd(4)}  ${"캐릭터".padEnd(16)}  ${"누적 점수".padEnd(10)}  경기 수`),
            sys("─".repeat(48)),
            ...(rows.length
              ? rows.map((r) =>
                  info(`  ${String(r.rank).padEnd(4)}  ${r.name.padEnd(16)}  ${String(r.total_score).padEnd(10)}  ${r.match_count}경기`)
                )
              : [info("  기록이 없습니다")]),
          ],
        };
      }

      return { logs: [err(`알 수 없는 pvp 서브커맨드: ${subcommand ?? "(없음)"}. pvp queue|submit|status|leaderboard`)] };
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

    // ──────────── say (레이드 채팅) ────────────
    case "say": {
      if (!context.activeRaidId) return { logs: [err("레이드 중에만 채팅 가능합니다")] };
      const text = [subcommand, ...args].filter(Boolean).join(" ");
      if (!text.trim()) return { logs: [err("메시지를 입력하세요")] };
      const res = await callAPI("/api/raid-command", {
        action: "chat",
        raid_id: context.activeRaidId,
        message: text.trim(),
        idempotency_key: idempotencyKey,
      });
      if (!res.ok) return { logs: [err(res.error ?? "채팅 전송 실패")] };
      return { logs: [] }; // Realtime으로 표시됨
    }

    // ──────────── cc (커뮤니티 채팅) ────────────
    case "cc": {
      const text = [subcommand, ...args].filter(Boolean).join(" ");
      if (!text.trim()) {
        return {
          logs: [sys("── COMMUNITY 패널 열기 ──")],
          data: { openCommunity: true },
        };
      }
      const res = await callAPI("/api/community", { action: "chat", message: text.trim() });
      if (!res.ok) return { logs: [err(res.error ?? "전송 실패")] };
      return {
        logs: [info(`[커뮤] ${text.trim()}`)],
        data: { openCommunity: true },
      };
    }

    // ──────────── community ────────────
    case "community": {
      return {
        logs: [sys("── COMMUNITY 패널을 열었습니다 ──")],
        data: { openCommunity: true },
      };
    }

    // ──────────── friend ────────────
    case "friend": {
      if (!subcommand || subcommand === "list") {
        const res = await callAPI("/api/community", { action: "friend_list" });
        if (!res.ok) return { logs: [err(res.error ?? "조회 실패")] };
        const friends = (res.data?.friends ?? []) as Array<{ name: string }>;
        const requests = (res.data?.requests ?? []) as Array<{ name: string }>;
        const logs: LogLine[] = [sys("━━ 친구 목록 ━━")];
        if (friends.length === 0) {
          logs.push(info("  친구가 없습니다"));
        } else {
          for (const f of friends) logs.push(info(`  ● ${f.name}`));
        }
        if (requests.length > 0) {
          logs.push(sys("── 받은 요청 ──"));
          for (const r of requests) {
            logs.push(info(`  ${r.name}  (friend accept ${r.name} 으로 수락)`));
          }
        }
        return { logs };
      }
      if (subcommand === "add") {
        const name = args[0] ?? "";
        if (!name) return { logs: [err("사용법: friend add <캐릭터명>")] };
        const res = await callAPI("/api/community", { action: "friend_add", name });
        return { logs: [res.ok ? success(String(res.data?.message ?? "요청 전송")) : err(res.error ?? "실패")] };
      }
      if (subcommand === "accept") {
        const name = args[0] ?? "";
        if (!name) return { logs: [err("사용법: friend accept <캐릭터명>")] };
        const res = await callAPI("/api/community", { action: "friend_accept", name });
        return { logs: [res.ok ? success(String(res.data?.message ?? "수락")) : err(res.error ?? "실패")] };
      }
      if (subcommand === "remove") {
        const name = args[0] ?? "";
        if (!name) return { logs: [err("사용법: friend remove <캐릭터명>")] };
        const res = await callAPI("/api/community", { action: "friend_remove", name });
        return { logs: [res.ok ? success(String(res.data?.message ?? "삭제")) : err(res.error ?? "실패")] };
      }
      return { logs: [err("사용법: friend <list|add|accept|remove> [이름]")] };
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
type RaidAction = {
  action_key: string;
  label: string;
  description?: string;
  kpi_effect?: Record<string, number>;
  position_bonus?: Record<string, number>;
  cooldown_sec?: number;
  cooldown_remaining?: number;
  is_ready?: boolean;
  crit_chance?: number;
  back_chance?: number;
};

// ──────────── 페이즈 한글 매핑 ────────────
const PHASE_KO: Record<string, string> = {
  plan:      "기획",
  implement: "구현",
  test:      "테스트",
  deploy:    "배포",
  operate:   "운영",
};

// ──────────── UI 헬퍼: ASCII 바 ────────────

function bar(value: number, max: number, width = 10): string {
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function formatResourceBars(r: { time: number; risk: number; debt: number; quality: number }): LogLine[] {
  return [
    info(`시간  [${bar(r.time, 100)}] ${String(r.time).padStart(3)}  위험  [${bar(r.risk, 100)}] ${String(r.risk).padStart(3)}`),
    info(`품질  [${bar(r.quality, 100)}] ${String(r.quality).padStart(3)}  부채  [${bar(r.debt, 50)}]  ${String(r.debt).padStart(2)}`),
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

const RISK_BADGE: Record<string, string> = {
  safe:     "[안전 75%]",
  balanced: "[균형 60%]",
  risky:    "[위험 40%]",
  gamble:   "[도박 25%]",
};

function formatEventCard(data: Record<string, unknown>): LogLine[] {
  const title = String(data.title ?? "");
  const description = String(data.description ?? "");
  const severity = Number(data.severity ?? 1);
  const choices = (data.choices ?? []) as Array<{ label: string; description?: string; risk_level?: string }>;
  const hr = "─".repeat(48);
  return [
    sys(`┌${hr}┐`),
    sys(`│  ⚡ ${title}  [${severity}★]`),
    sys(`├${hr}┤`),
    info(`│  ${description}`),
    sys(`├${hr}┤`),
    ...choices.map((c, i) => info(`│  [${i}] ${RISK_BADGE[c.risk_level ?? ""] ?? ""}  ${c.label}`)),
    sys(`└${hr}┘`),
    info(`choose <0|1|2|3> 로 선택하세요`),
  ];
}

// 티켓 확률 표시 — work 성공/실패/크리 기본 확률(70/25/5%) 기반
function ticketProbDisplay(riskDelta: number, qualDelta: number): string {
  // RISK: 성공 시 riskDelta, 실패 시 riskDelta+2, 크리 시 riskDelta-2
  const pRiskUp =
    (riskDelta     > 0 ? 0.70 : 0) +
    (riskDelta + 2 > 0 ? 0.25 : 0) +
    (riskDelta - 2 > 0 ? 0.05 : 0);

  // QUAL: 성공 시 qualDelta, 실패 시 qualDelta-1, 크리 시 qualDelta+5
  const pQualUp =
    (qualDelta     > 0 ? 0.70 : 0) +
    (qualDelta - 1 > 0 ? 0.25 : 0) +
    (qualDelta + 5 > 0 ? 0.05 : 0);

  const riskStr =
    pRiskUp >= 0.92 ? "위험↑ 확정" :
    pRiskUp >= 0.65 ? `위험↑ ${Math.round(pRiskUp * 100)}%` :
    pRiskUp <= 0.08 ? "위험↓ 확정" :
    pRiskUp <= 0.35 ? `위험↓ ${Math.round((1 - pRiskUp) * 100)}%` :
                      `위험± ~${Math.round(pRiskUp * 100)}%↑`;

  const qualStr =
    pQualUp >= 0.92 ? "품질↑ 확정" :
    pQualUp >= 0.65 ? `품질↑ ${Math.round(pQualUp * 100)}%` :
    pQualUp <= 0.08 ? "품질↓ 확정" :
    pQualUp <= 0.35 ? `품질↓ ${Math.round((1 - pQualUp) * 100)}%` :
                      `품질± ~${Math.round(pQualUp * 100)}%↑`;

  return `시간↓ 확정  ${riskStr}  ${qualStr}`;
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
  const labels = ["A", "B", "C", "D"];
  const hr = "─".repeat(52);
  const phaseKo = PHASE_KO[phase] ?? phase;
  const headerLabel = `티켓 패 (페이즈: ${phaseKo})`;
  const headerPad = Math.max(0, 52 - 4 - headerLabel.length);
  const lines: LogLine[] = [
    sys(`┌── ${headerLabel} ${"─".repeat(headerPad)}┐`),
  ];
  hand.forEach((ticket, i) => {
    const prob = ticketProbDisplay(ticket.base_risk_delta, ticket.base_quality_delta);
    lines.push(info(`│  [${labels[i]}] ${ticket.ticket_key.padEnd(16)} [${ticket.position_tag}]  ${ticket.title}`));
    lines.push(info(`│       ${prob}`));
    if (i < hand.length - 1) lines.push(sys(`├${hr}┤`));
  });
  lines.push(sys(`└${hr}┘`));
  return lines;
}

type DrawTicket = {
  ticket_key: string; title: string; position_tag: string;
  base_time_cost: number; base_risk_delta: number; base_quality_delta: number;
};

function buildDrawInteractive(
  hand: DrawTicket[],
  phase?: string,
): { interactive: LogLine; quickMode: QuickMode } {
  const labels = ["A", "B", "C", "D"];
  const phaseLabel = PHASE_KO[phase ?? ""] ?? (phase ?? "");
  return {
    interactive: {
      timestamp: new Date().toISOString(),
      level: "interactive",
      message: "티켓 선택",
      data: {
        type: "cards",
        items: hand.map((ticket, i) => ({
          label: ticket.title,
          command: `work ${ticket.ticket_key}`,
          meta: `[${ticket.position_tag}]  ${ticketProbDisplay(ticket.base_risk_delta, ticket.base_quality_delta)}`,
          badge: ticket.position_tag,
          key: labels[i],
        })),
      },
    },
    quickMode: {
      hint: `A/B/C/D로 티켓 선택${phaseLabel ? ` (페이즈: ${phaseLabel})` : ""}`,
      map: Object.fromEntries(hand.map((t, i) => [labels[i], `work ${t.ticket_key}`])),
    },
  };
}

function formatPhaseBanner(from: string, to: string): LogLine[] {
  const fromKo = PHASE_KO[from.toLowerCase()] ?? from.toUpperCase();
  const toKo = PHASE_KO[to.toLowerCase()] ?? to.toUpperCase();
  const arrow = ` ──────────→ `;
  const inner = `    ${fromKo}${arrow}${toKo}`;
  const width = Math.max(46, inner.length + 4);
  const hr = "═".repeat(width);
  const pad = (s: string) => s.padEnd(width - 2);
  return [
    sys(`╔${hr}╗`),
    sys(`║  ${pad("★ 페이즈 완료!")}║`),
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
    flow_state:          "몰입 상태          (성공률 ↑ +15%)",
    tired:               "피로               (실수 위험 ↑ +5%)",
    focused:             "집중               (품질 +5/턴)",
    guaranteed_critical: "보장 치명타 ★      (다음 work 자동 치명타)",
    risk_shield:         "위험 방어막        (사고 차단)",
    success_boost:       "성공 부스트        (성공률 ↑)",
  };
  const colorOf = (type: string) => {
    if (type === "tired") return warn;
    if (type === "guaranteed_critical") return sys;
    return success;
  };
  return [
    sys("── 활성 효과 ─────────────────────────────"),
    ...effects.map((e) => colorOf(e.type)(`  [${LABELS[e.type] ?? e.type}]  잔 ${e.turns_left}턴`)),
  ];
}

function formatStreakBadge(streak: number, streakMessages: string[]): LogLine[] {
  if (streak < 2) return [];
  const badge =
    streak >= 10 ? `★★★ 무아지경!  연속 x${streak} ★★★` :
    streak >= 5  ? `★★ 불타오른다!  연속 x${streak} ★★` :
    streak >= 3  ? `★ 연속 x${streak}` :
                   `연속 x${streak}`;
  const lines: LogLine[] = [success(`  ${badge}`)];
  for (const msg of streakMessages) lines.push(success(`  ${msg}`));
  return lines;
}

function formatRiskDangerZone(risk: number): LogLine[] {
  if (risk < 50) return [];
  const level =
    risk >= 90 ? err(`  ⚠ 위험 구역! 위험도 ${risk} — 사고 확률 20%`) :
    risk >= 70 ? warn(`  ⚠ 고위험  위험도 ${risk} — 사고 확률 8%`) :
                 warn(`  ⚠ 위험도 ${risk} — 사고 확률 3%`);
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
    logs.push(info(`페이즈: ${PHASE_KO[String(run.phase)] ?? run.phase}  상태: ${run.status}`));
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
    info(`페이즈: ${PHASE_KO[String(r.phase)] ?? r.phase}  티어: ${r.tier}`),
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

// ──────────── XP 표시 파서 ────────────
function formatXPGrant(xpGranted: Record<string, unknown>): string {
  const parts: string[] = [];
  const pos = xpGranted.position as Record<string, number> | undefined;
  const core = xpGranted.core as Record<string, number> | undefined;
  if (pos) {
    for (const [k, v] of Object.entries(pos)) parts.push(`${k} +${v}`);
  }
  if (core) {
    for (const [k, v] of Object.entries(core)) parts.push(`${k} +${v}`);
  }
  return parts.length ? parts.join("  ") : "0";
}

// ──────────── 레이드 KPI 효과 요약 ────────────
function formatKPIEffect(kpiEffect: Record<string, number>): string {
  const parts: string[] = [];
  if (kpiEffect.error_rate_reduce)  parts.push(`에러↓${kpiEffect.error_rate_reduce}`);
  if (kpiEffect.success_rate_add)   parts.push(`성공↑${kpiEffect.success_rate_add}`);
  if (kpiEffect.latency_reduce)     parts.push(`지연↓${kpiEffect.latency_reduce}`);
  if (kpiEffect.deploy_health_add)  parts.push(`배포↑${kpiEffect.deploy_health_add}`);
  return parts.join(" ");
}

// ──────────── 레이드 액션 메뉴 (쿨다운 표시) ────────────
function formatRaidActionMenu(actions: RaidAction[]): LogLine[] {
  if (!actions.length) return [];

  const readyActions = actions.filter((a) => a.is_ready !== false && (a.cooldown_remaining ?? 0) === 0);
  const lines: LogLine[] = [sys("── 가용 액션 ─────────────────────────────────────")];

  let readyIdx = 0;
  for (const a of actions) {
    const effect = formatKPIEffect(a.kpi_effect ?? {});
    const isReady = a.is_ready !== false && (a.cooldown_remaining ?? 0) === 0;
    const chanceStr = a.crit_chance !== undefined
      ? `치명${Math.round(a.crit_chance * 100)}%/역효${Math.round((a.back_chance ?? 0) * 100)}%`
      : "";
    if (isReady) {
      readyIdx++;
      lines.push(info(`  [${readyIdx}] ${a.label.padEnd(16)} ${chanceStr.padEnd(14)} ${effect}`));
    } else {
      lines.push(sys(`  [ ] ${a.label.padEnd(16)} ⏱ ${a.cooldown_remaining}초`));
    }
  }
  lines.push(sys("──────────────────────────────────────────────────"));

  // 준비된 액션만 인터랙티브 버튼으로
  if (readyActions.length > 0) {
    const interactive: LogLine = {
      timestamp: new Date().toISOString(),
      level: "interactive",
      message: "레이드 액션",
      data: {
        type: "choices",
        items: readyActions.map((a, i) => ({
          label: a.label,
          command: `raid action ${a.action_key}`,
          meta: formatKPIEffect(a.kpi_effect ?? {}),
          key: String(i + 1),
        })),
      },
    };
    lines.push(interactive);
  } else {
    lines.push(sys("  ⏳ 모든 액션 쿨다운 중 — 잠시 후 재시도하세요"));
  }
  return lines;
}

// ──────────── 레이드 QuickMode 빌더 (준비된 액션만) ────────────
function buildRaidQuickMode(actions: RaidAction[]): QuickMode | null {
  const readyActions = actions.filter((a) => a.is_ready !== false && (a.cooldown_remaining ?? 0) === 0);
  if (!readyActions.length) return null;
  const map: Record<string, string> = {};
  readyActions.forEach((a, i) => { map[String(i + 1)] = `raid action ${a.action_key}`; });
  const hint = readyActions.slice(0, 5).map((a, i) => `${i + 1}:${a.label}`).join("  ");
  return { hint, map };
}
