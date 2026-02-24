// ============================================================
// STACKWORLD - Edge Function: cleanup_daily
// 하루 1회: 로그 정리 + 계약 갱신 + 시즌 체크
// Supabase Cron: "0 3 * * *" (매일 새벽 3시 UTC)
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? ""; // 외부 호출 방지

const LOG_RETENTION_DAYS = 14;
const LOG_MAX_ROWS = 5_000;
const DAILY_CONTRACTS = 10;

serve(async (req: Request) => {
  // Cron 호출 인증 (Supabase Cron은 service_role 사용, 외부 호출 방지)
  const authHeader = req.headers.get("Authorization");
  const isServiceRole = authHeader === `Bearer ${SUPABASE_SERVICE_KEY}`;
  const isCronSecret = req.headers.get("X-Cron-Secret") === CRON_SECRET && CRON_SECRET.length > 0;

  if (!isServiceRole && !isCronSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results: Record<string, unknown> = {};

  console.log("[cleanup_daily] 시작:", new Date().toISOString());

  // ──────────── 1. run_commands 로그 정리 ────────────
  try {
    const cutoffDate = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // 14일 이상 된 로그 삭제
    const { count: cmdDeletedByDate } = await db
      .from("run_commands")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate);

    results.run_commands_deleted_by_date = cmdDeletedByDate;

    // 5000건 초과 시 오래된 것부터 삭제
    const { count: cmdTotal } = await db
      .from("run_commands")
      .select("*", { count: "exact", head: true });

    if ((cmdTotal ?? 0) > LOG_MAX_ROWS) {
      const excess = (cmdTotal ?? 0) - LOG_MAX_ROWS;
      // 오래된 순으로 excess건 조회 후 삭제
      const { data: oldCmds } = await db
        .from("run_commands")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(excess);

      if (oldCmds && oldCmds.length > 0) {
        const ids = oldCmds.map((r: { id: string }) => r.id);
        const { count: deletedExcess } = await db
          .from("run_commands")
          .delete({ count: "exact" })
          .in("id", ids);
        results.run_commands_deleted_excess = deletedExcess;
      }
    }
  } catch (e) {
    console.error("[cleanup] run_commands 정리 실패:", e);
    results.run_commands_error = String(e);
  }

  // ──────────── 2. run_events 로그 정리 ────────────
  try {
    const cutoffDate = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { count: evtDeleted } = await db
      .from("run_events")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate);
    results.run_events_deleted = evtDeleted;
  } catch (e) {
    results.run_events_error = String(e);
  }

  // ──────────── 3. raid_events 로그 정리 ────────────
  try {
    const cutoffDate = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { count: raidEvtDeleted } = await db
      .from("raid_events")
      .delete({ count: "exact" })
      .lt("created_at", cutoffDate);
    results.raid_events_deleted = raidEvtDeleted;
  } catch (e) {
    results.raid_events_error = String(e);
  }

  // ──────────── 4. 만료된 계약 정리 + 새 계약 생성 ────────────
  try {
    // 만료 계약 삭제
    const { count: expiredContracts } = await db
      .from("contracts")
      .delete({ count: "exact" })
      .lt("expires_at", new Date().toISOString())
      .is("filled_by", null);
    results.contracts_expired = expiredContracts;

    // 현재 활성 계약 수 확인
    const { count: activeContracts } = await db
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .gt("expires_at", new Date().toISOString())
      .is("filled_by", null);

    const toCreate = DAILY_CONTRACTS - (activeContracts ?? 0);
    if (toCreate > 0) {
      // 랜덤 아티팩트로 계약 생성
      const { data: artifacts } = await db
        .from("artifacts")
        .select("artifact_key")
        .in("rarity", ["common", "rare"])
        .limit(toCreate * 2);

      if (artifacts && artifacts.length > 0) {
        const newContracts = Array.from({ length: toCreate }, (_, i) => {
          const art = artifacts[i % artifacts.length];
          return {
            contract_key: `DAILY_${new Date().toISOString().split("T")[0]}_${i}`,
            target_artifact_key: art.artifact_key,
            qty_required: Math.floor(Math.random() * 3) + 1,
            reward_credits: (Math.floor(Math.random() * 5) + 3) * 50,
            reward_xp: {},
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          };
        });

        await db.from("contracts").insert(newContracts);
        results.contracts_created = toCreate;
      }
    }
  } catch (e) {
    results.contracts_error = String(e);
  }

  // ──────────── 5. 시즌 만료 체크 ────────────
  try {
    const { data: activeSeason } = await db
      .from("seasons")
      .select("id, name, ends_at")
      .eq("is_active", true)
      .single();

    if (activeSeason && new Date(activeSeason.ends_at) < new Date()) {
      // 시즌 종료
      await db.from("seasons").update({ is_active: false }).eq("id", activeSeason.id);
      results.season_ended = activeSeason.name;
      console.log(`[cleanup] 시즌 종료: ${activeSeason.name}`);

      // 다음 시즌 자동 생성 (관리자가 수동으로 생성하는 것이 더 안전하지만 편의상 자동 생성)
      // 실제 운영에서는 주석 처리 후 수동 관리 권장
      /*
      await db.from("seasons").insert({
        name: `Season ${Date.now()}`,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      });
      */
    }
  } catch (e) {
    results.season_check_error = String(e);
  }

  // ──────────── 6. 만료된 마켓 리스팅 정리 (7일 이상) ────────────
  try {
    const cutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: oldListings } = await db
      .from("market_listings")
      .delete({ count: "exact" })
      .lt("created_at", cutoff7d)
      .eq("is_active", true);
    results.market_listings_expired = oldListings;
  } catch (e) {
    results.market_listings_error = String(e);
  }

  // ──────────── 7. 레이드 고착 정리 (24시간 이상 active) ────────────
  try {
    const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: stuckRaids } = await db
      .from("raids")
      .update({ status: "failed", ended_at: new Date().toISOString() }, { count: "exact" })
      .eq("status", "active")
      .lt("started_at", cutoff24h);
    results.stuck_raids_cleaned = stuckRaids;
  } catch (e) {
    results.stuck_raids_error = String(e);
  }

  // ──────────── cleanup_jobs 갱신 ────────────
  await db.from("cleanup_jobs").upsert({
    job_key: "daily_log_cleanup",
    last_run_at: new Date().toISOString(),
  }, { onConflict: "job_key" });

  console.log("[cleanup_daily] 완료:", results);

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
