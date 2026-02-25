import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // 대기 중인 매치 탐색
    const { data: existingMatch } = await supabase
      .from("pvp_matches")
      .select("id, seed")
      .eq("mode", mode)
      .eq("tier", tier)
      .eq("status", "queuing")
      .neq("id", "00000000-0000-0000-0000-000000000000") // 자기 자신이 만든 매치 제외는 서버에서
      .single();

    if (existingMatch) {
      // 기존 매치 참여
      await supabase.from("pvp_entries").upsert(
        { match_id: existingMatch.id, character_id: character.id },
        { onConflict: "match_id,character_id" },
      );

      const { count } = await supabase
        .from("pvp_entries")
        .select("*", { count: "exact", head: true })
        .eq("match_id", existingMatch.id);

      // 2명 이상 → active
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

    // 새 매치 생성
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

    // 가장 최근 pvp_entry 조회
    const { data: entry } = await supabase
      .from("pvp_entries")
      .select("*, pvp_matches(mode, tier, status, seed, created_at)")
      .eq("character_id", character.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!entry) return NextResponse.json({ ok: true, entry: null });

    const match = entry.pvp_matches as Record<string, unknown> | null;

    // 같은 매치의 전체 참여자 수
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

  // ──────────── PvP Submit → Edge Function 위임 ────────────
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pvp_submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    },
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
