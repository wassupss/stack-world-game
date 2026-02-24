import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // PvP queue는 로컬에서 처리
  if (body.action === "queue") {
    const { data: character } = await supabase
      .from("characters")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!character)
      return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

    // 활성 매치 찾기 또는 생성
    const { data: existingMatch } = await supabase
      .from("pvp_matches")
      .select("id, seed")
      .eq("mode", body.mode)
      .eq("tier", body.tier ?? 1)
      .eq("status", "queuing")
      .single();

    if (existingMatch) {
      // 기존 매치 참여
      await supabase.from("pvp_entries").upsert(
        {
          match_id: existingMatch.id,
          character_id: character.id,
        },
        { onConflict: "match_id,character_id" }
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
        message: `PvP 매치 참여 (${
          body.mode
        }). seed: ${existingMatch.seed.slice(-8)}`,
      });
    }

    // 새 매치 생성
    const seed = `pvp-${body.mode}-${Date.now()}`;
    const { data: season } = await supabase
      .from("seasons")
      .select("id")
      .eq("is_active", true)
      .single();

    const { data: newMatch } = await supabase
      .from("pvp_matches")
      .insert({
        mode: body.mode,
        tier: body.tier ?? 1,
        seed,
        season_id: season?.id,
        status: "queuing",
      })
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
      message: `새 PvP 매치 생성 (${body.mode}). seed: ${seed.slice(
        -8
      )}. 상대방을 기다리는 중...`,
    });
  }

  // submit은 Edge Function으로
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pvp_submit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
