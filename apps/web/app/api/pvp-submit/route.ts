// ============================================================
// STACKWORLD - API Route: /api/pvp-submit
// PvP 매치 관리 + 점수 서버 계산 + 리더보드 업데이트 (Edge Function 직접 이식)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ──────────── PvP 점수 공식 ────────────
function calcGolfScore(p: {
  command_count: number;
  quality: number;
  debt: number;
  elapsed_sec: number;
}): number {
  if (p.command_count <= 0) return 0;
  return Math.max(0, Math.round(
    (1000 / p.command_count) * (p.quality / 100)
    - p.debt * 10
    - p.elapsed_sec * 0.1,
  ));
}

function calcSpeedrunScore(p: {
  elapsed_sec: number;
  quality: number;
  debt: number;
}): number {
  if (p.elapsed_sec <= 0) return 0;
  return Math.max(0, Math.round(
    (10000 / p.elapsed_sec) * (p.quality / 100)
    - p.debt * 20,
  ));
}

const PvpSubmitSchema = z.object({
  match_id: z.string().uuid(),
  run_id:   z.string().uuid(),
  idempotency_key: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // ──────────── PvP Queue (매치 참여 / 생성) ────────────
  if (body.action === "queue") {
    const { data: character } = await supabase
      .from("characters")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!character) return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

    const mode = body.mode ?? "golf";
    const tier = body.tier ?? 1;

    const { data: existingMatch } = await supabase
      .from("pvp_matches")
      .select("id, seed")
      .eq("mode", mode)
      .eq("tier", tier)
      .eq("status", "queuing")
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .single();

    if (existingMatch) {
      await supabase.from("pvp_entries").upsert(
        { match_id: existingMatch.id, character_id: character.id },
        { onConflict: "match_id,character_id" },
      );

      const { count } = await supabase
        .from("pvp_entries")
        .select("*", { count: "exact", head: true })
        .eq("match_id", existingMatch.id);

      if ((count ?? 0) >= 2) {
        await supabase
          .from("pvp_matches")
          .update({ status: "active" })
          .eq("id", existingMatch.id);
      }

      return NextResponse.json({
        ok: true,
        match_id: existingMatch.id,
        seed: existingMatch.seed,
        participants: count,
        matched: true,
        message: `상대방 매치에 합류했습니다 (${mode} Tier ${tier})`,
      });
    }

    const seed = `pvp-${mode}-${Date.now()}`;
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    const { data: newMatch } = await supabase
      .from("pvp_matches")
      .insert({ mode, tier, seed, season_id: season?.id, status: "queuing" })
      .select("id")
      .single();

    await supabase.from("pvp_entries").insert({
      match_id: newMatch!.id,
      character_id: character.id,
    });

    return NextResponse.json({
      ok: true,
      match_id: newMatch!.id,
      seed,
      participants: 1,
      matched: false,
      message: `새 PvP 매치 생성 (${mode} Tier ${tier}). 상대방 대기 중...`,
    });
  }

  // ──────────── PvP Status (현재 매치 상태) ────────────
  if (body.action === "pvp_status") {
    const { data: character } = await supabase
      .from("characters")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!character) return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

    const { data: entry } = await supabase
      .from("pvp_entries")
      .select("*, pvp_matches(mode, tier, status, seed, created_at)")
      .eq("character_id", character.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!entry) return NextResponse.json({ ok: true, entry: null });

    const match = entry.pvp_matches as Record<string, unknown> | null;

    const { count: totalCount } = await supabase
      .from("pvp_entries")
      .select("*", { count: "exact", head: true })
      .eq("match_id", entry.match_id);

    const { count: submittedCount } = await supabase
      .from("pvp_entries")
      .select("*", { count: "exact", head: true })
      .eq("match_id", entry.match_id)
      .not("submitted_at", "is", null);

    return NextResponse.json({
      ok: true,
      entry: {
        match_id:       entry.match_id,
        mode:           match?.mode,
        tier:           match?.tier,
        status:         match?.status,
        seed:           match?.seed,
        created_at:     match?.created_at,
        my_score:       entry.score,
        submitted:      !!entry.submitted_at,
        total_entries:  totalCount,
        submitted_count: submittedCount,
      },
    });
  }

  // ──────────── PvP Leaderboard ────────────
  if (body.action === "pvp_leaderboard") {
    const mode = body.mode ?? "golf";

    const { data: season } = await supabase
      .from("seasons")
      .select("id, name")
      .eq("is_active", true)
      .single();

    if (!season) return NextResponse.json({ ok: true, leaderboard: [], season: null });

    const { data: rows } = await supabase
      .from("leaderboards")
      .select("character_id, total_score, match_count, characters(name)")
      .eq("season_id", season.id)
      .eq("mode", mode)
      .order("total_score", { ascending: false })
      .limit(15);

    return NextResponse.json({
      ok: true,
      season: season.name ?? "현재 시즌",
      mode,
      leaderboard: (rows ?? []).map((r, i) => ({
        rank:        i + 1,
        name:        (r.characters as unknown as { name: string } | null)?.name ?? "???",
        total_score: r.total_score,
        match_count: r.match_count,
      })),
    });
  }

  // ──────────── PvP Submit (점수 계산 + 리더보드) ────────────
  const admin = createAdminClient();

  const { data: character } = await admin
    .from("characters")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!character) return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

  const parsed = PvpSubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "입력 오류", details: parsed.error.flatten() }, { status: 400 });

  const { match_id, run_id } = parsed.data;

  // Idempotency
  const { data: existingEntry } = await admin
    .from("pvp_entries")
    .select("id, score")
    .eq("match_id", match_id)
    .eq("character_id", character.id)
    .not("submitted_at", "is", null)
    .single();
  if (existingEntry) return NextResponse.json({ ok: true, cached: true, score: existingEntry.score });

  const { data: match } = await admin
    .from("pvp_matches")
    .select("mode, seed, season_id, status, created_at")
    .eq("id", match_id)
    .in("status", ["queuing", "active"])
    .single();
  if (!match) return NextResponse.json({ error: "진행 중인 매치를 찾을 수 없습니다" }, { status: 404 });

  const { data: run } = await admin
    .from("runs")
    .select("character_id, status, quality, debt, cmd_count, started_at, ended_at")
    .eq("id", run_id)
    .single();

  if (!run)                              return NextResponse.json({ error: "런을 찾을 수 없습니다" }, { status: 404 });
  if (run.character_id !== character.id) return NextResponse.json({ error: "본인의 런만 제출 가능합니다" }, { status: 403 });
  if (run.status !== "completed")        return NextResponse.json({ error: "완료된 런만 제출 가능합니다" }, { status: 400 });

  if (run.started_at && match.created_at) {
    const runStart     = new Date(run.started_at).getTime();
    const matchCreated = new Date(match.created_at).getTime();
    if (runStart < matchCreated - 60_000) {
      return NextResponse.json({ error: "매치 생성 이전에 시작한 런은 제출할 수 없습니다" }, { status: 400 });
    }
  }

  const elapsed_sec = run.ended_at && run.started_at
    ? Math.max(1, Math.floor(
        (new Date(run.ended_at).getTime() - new Date(run.started_at).getTime()) / 1000,
      ))
    : 9999;

  let score: number;
  if (match.mode === "golf") {
    score = calcGolfScore({
      command_count: run.cmd_count,
      quality:       run.quality,
      debt:          run.debt,
      elapsed_sec,
    });
  } else {
    score = calcSpeedrunScore({ elapsed_sec, quality: run.quality, debt: run.debt });
  }

  const { data: runEvents } = await admin
    .from("run_events")
    .select("result")
    .eq("run_id", run_id)
    .not("choice_index", "is", null);

  let luckBonus = 0;
  for (const ev of runEvents ?? []) {
    const ot = (ev.result as Record<string, unknown>)?.outcome_type;
    if (ot === "success") luckBonus += 8;
    else if (ot === "partial") luckBonus += 2;
    else if (ot === "fail") luckBonus -= 10;
  }
  score = Math.max(0, score + luckBonus);

  await admin.from("pvp_entries").insert({
    match_id,
    character_id:  character.id,
    run_id,
    score,
    command_count: run.cmd_count,
    elapsed_sec,
    quality:       run.quality,
    debt_penalty:  match.mode === "golf" ? run.debt * 10 : run.debt * 20,
    submitted_at:  new Date().toISOString(),
  });

  if (match.season_id) {
    const { data: existingLb } = await admin
      .from("leaderboards")
      .select("total_score, match_count")
      .eq("season_id", match.season_id)
      .eq("mode", match.mode)
      .eq("character_id", character.id)
      .single();

    await admin.from("leaderboards").upsert({
      season_id:    match.season_id,
      mode:         match.mode,
      character_id: character.id,
      total_score:  (existingLb?.total_score ?? 0) + score,
      match_count:  (existingLb?.match_count ?? 0) + 1,
      updated_at:   new Date().toISOString(),
    }, { onConflict: "season_id,mode,character_id", ignoreDuplicates: false });
  }

  const pvpBonus = Math.max(10, Math.floor(score * 0.05));
  await admin.rpc("grant_credits", { p_character_id: character.id, p_amount: pvpBonus });

  const { count: totalEntries } = await admin
    .from("pvp_entries")
    .select("*", { count: "exact", head: true })
    .eq("match_id", match_id);

  const { count: submittedCount } = await admin
    .from("pvp_entries")
    .select("*", { count: "exact", head: true })
    .eq("match_id", match_id)
    .not("submitted_at", "is", null);

  const allSubmitted = (submittedCount ?? 0) > 0 && submittedCount === totalEntries;
  if (allSubmitted) {
    await admin.from("pvp_matches").update({ status: "completed" }).eq("id", match_id);
  }

  const result = {
    match_id,
    score,
    credits_earned: pvpBonus,
    mode: match.mode,
    submitted_count: submittedCount,
    total_entries:   totalEntries,
    match_completed: allSubmitted,
    breakdown: match.mode === "golf"
      ? { cmd_count: run.cmd_count, quality: run.quality, debt: run.debt, elapsed_sec }
      : { elapsed_sec, quality: run.quality, debt: run.debt },
    luck_bonus: luckBonus,
    message: `[PvP 제출 완료] 점수: ${score}  (+${pvpBonus}cr 보상)${luckBonus !== 0 ? `  운 보너스: ${luckBonus > 0 ? "+" : ""}${luckBonus}pt` : ""}`,
  };

  return NextResponse.json({ ok: true, result });
}
