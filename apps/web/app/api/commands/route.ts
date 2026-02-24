// ============================================================
// STACKWORLD - API Route: /api/commands
// 읽기 전용 쿼리 + 파티 관리 (Edge Function 호출 없는 것들)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  const { data: character } = await supabase
    .from("characters")
    .select("id, name, credits, queued_modifier")
    .eq("user_id", user.id)
    .single();

  if (!character)
    return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

  switch (action) {
    case "status": {
      const { data: activeRun } = await supabase
        .from("runs")
        .select(
          "id, phase, status, time, risk, debt, quality, tier, seed, cmd_count, current_streak, active_effects, position_streak, position_streak_tag, active_modifier"
        )
        .eq("character_id", character.id)
        .eq("status", "active")
        .single();

      // 활성 레이드 찾기 (파티 → 레이드)
      const { data: partyMember } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("character_id", character.id)
        .single();

      let activeRaid = null;
      let partyMembers: Array<{ character_id: string; characters: { name: string } | null }> = [];
      let partyInfo: { id: string; code: string } | null = null;
      if (partyMember) {
        const { data: raid } = await supabase
          .from("raids")
          .select("id, scenario_key, status, kpi, time_limit_sec, tier, mode, phase, started_at")
          .eq("party_id", partyMember.party_id)
          .in("status", ["waiting", "active"])
          .single();
        activeRaid = raid;

        const { data: members } = await supabase
          .from("party_members")
          .select("character_id, characters(name)")
          .eq("party_id", partyMember.party_id);
        partyMembers = (members ?? []) as unknown as typeof partyMembers;

        const { data: party } = await supabase
          .from("parties")
          .select("id, code")
          .eq("id", partyMember.party_id)
          .single();
        partyInfo = party;
      }

      const [upgradesResult, ownedItemsResult] = await Promise.all([
        supabase.from("character_upgrades").select("item_key, level").eq("character_id", character.id),
        supabase.from("character_items").select("item_key, qty").eq("character_id", character.id).gt("qty", 0),
      ]);

      return NextResponse.json({
        ok: true,
        character,
        active_run: activeRun ?? null,
        active_raid: activeRaid ?? null,
        party_members: partyMembers,
        party_info: partyInfo,
        owned_upgrades: upgradesResult.data ?? [],
        owned_items: ownedItemsResult.data ?? [],
      });
    }

    case "tickets": {
      // 현재 활성 런의 페이즈 파악 → 해당 페이즈 티켓 목록
      const phase = body.phase as string | undefined;
      if (!phase) {
        // phase 미제공 시 활성 런에서 조회
        const { data: activeRun } = await supabase
          .from("runs")
          .select("phase")
          .eq("character_id", character.id)
          .eq("status", "active")
          .single();
        if (!activeRun)
          return NextResponse.json({ error: "활성 런이 없습니다" }, { status: 400 });

        const { data: tickets } = await supabase
          .from("tickets")
          .select("ticket_key, title, position_tag, base_time_cost, base_risk_delta, base_quality_delta")
          .eq("phase", activeRun.phase)
          .order("position_tag")
          .order("ticket_key");
        return NextResponse.json({ ok: true, phase: activeRun.phase, tickets });
      }
      const { data: tickets } = await supabase
        .from("tickets")
        .select("ticket_key, title, position_tag, base_time_cost, base_risk_delta, base_quality_delta")
        .eq("phase", phase)
        .order("position_tag")
        .order("ticket_key");
      return NextResponse.json({ ok: true, phase, tickets });
    }

    case "mastery": {
      const { data: pos } = await supabase
        .from("position_mastery")
        .select("position, level, xp")
        .eq("character_id", character.id);

      const { data: core } = await supabase
        .from("core_mastery")
        .select("core, level, xp")
        .eq("character_id", character.id);

      return NextResponse.json({ ok: true, position: pos, core });
    }

    case "devpower": {
      const { data: devpower } = await supabase.rpc("calc_devpower", {
        p_character_id: character.id,
      });

      // Reliability: 총 런에서 실패율 기반
      const { count: totalRuns } = await supabase
        .from("runs")
        .select("*", { count: "exact", head: true })
        .eq("character_id", character.id)
        .in("status", ["completed", "failed"]);

      const { count: failedRuns } = await supabase
        .from("runs")
        .select("*", { count: "exact", head: true })
        .eq("character_id", character.id)
        .eq("status", "failed");

      const reliability = totalRuns
        ? Math.round((1 - (failedRuns ?? 0) / (totalRuns ?? 1)) * 100)
        : 100;

      // Throughput: 최근 7일 런 수
      const { count: recentRuns } = await supabase
        .from("runs")
        .select("*", { count: "exact", head: true })
        .eq("character_id", character.id)
        .eq("status", "completed")
        .gt(
          "ended_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        );

      return NextResponse.json({
        ok: true,
        devpower,
        reliability,
        throughput: recentRuns ?? 0,
      });
    }

    case "titles": {
      const { data: titles } = await supabase
        .from("character_titles")
        .select("title_key, earned_at")
        .eq("character_id", character.id)
        .order("earned_at", { ascending: false });

      return NextResponse.json({ ok: true, titles });
    }

    case "inventory": {
      const { data: inventory } = await supabase
        .from("inventory")
        .select("artifact_key, qty")
        .eq("character_id", character.id)
        .gt("qty", 0);

      return NextResponse.json({ ok: true, inventory });
    }

    case "run_status": {
      const { data: run } = await supabase
        .from("runs")
        .select("*")
        .eq("character_id", character.id)
        .eq("status", "active")
        .single();

      return NextResponse.json({ ok: true, run });
    }

    case "raid_status": {
      const { data: party } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("character_id", character.id)
        .single();

      if (!party) return NextResponse.json({ ok: true, raid: null });

      const { data: raid } = await supabase
        .from("raids")
        .select("*")
        .eq("party_id", party.party_id)
        .in("status", ["waiting", "active"])
        .single();

      return NextResponse.json({ ok: true, raid });
    }

    case "raid_log": {
      const raidId = body.raid_id;
      if (!raidId)
        return NextResponse.json({ error: "raid_id 필요" }, { status: 400 });

      const { data: events } = await supabase
        .from("raid_events")
        .select("type, payload, created_at")
        .eq("raid_id", raidId)
        .order("created_at", { ascending: false })
        .limit(50);

      return NextResponse.json({ ok: true, events });
    }

    case "market_list": {
      const filter = body.filter as string | undefined;
      let query = supabase
        .from("market_listings")
        .select("id, artifact_key, qty, price_credits, seller_id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (filter) {
        query = query.ilike("artifact_key", `%${filter}%`);
      }

      const { data: listings } = await query;
      return NextResponse.json({ ok: true, listings });
    }

    case "contract_list": {
      const { data: contracts } = await supabase
        .from("contracts")
        .select(
          "id, target_artifact_key, qty_required, reward_credits, expires_at"
        )
        .is("filled_by", null)
        .gt("expires_at", new Date().toISOString())
        .order("reward_credits", { ascending: false })
        .limit(10);

      return NextResponse.json({ ok: true, contracts });
    }

    // ──────────── 파티 관리 ────────────
    case "party_create": {
      const { data: party, error } = await supabase
        .from("parties")
        .insert({ leader_id: character.id })
        .select()
        .single();

      if (error)
        return NextResponse.json({ error: error.message }, { status: 400 });

      await supabase.from("party_members").insert({
        party_id: party.id,
        character_id: character.id,
      });

      return NextResponse.json({
        ok: true,
        party_id: party.id,
        code: party.code,
        message: `파티 생성됨. 코드: ${party.code}`,
      });
    }

    case "party_join": {
      const code = body.code as string;
      if (!code)
        return NextResponse.json({ error: "파티 코드 필요" }, { status: 400 });

      const { data: party } = await supabase
        .from("parties")
        .select("id, code")
        .eq("code", code.toUpperCase())
        .single();

      if (!party)
        return NextResponse.json(
          { error: "파티를 찾을 수 없습니다" },
          { status: 404 }
        );

      const { count } = await supabase
        .from("party_members")
        .select("*", { count: "exact", head: true })
        .eq("party_id", party.id);

      if ((count ?? 0) >= 5) {
        return NextResponse.json(
          { error: "파티 정원 초과 (최대 5명)" },
          { status: 400 }
        );
      }

      await supabase
        .from("party_members")
        .upsert(
          { party_id: party.id, character_id: character.id },
          { onConflict: "party_id,character_id" }
        );

      return NextResponse.json({
        ok: true,
        party_id: party.id,
        message: `파티 참여: ${code}`,
      });
    }

    case "party_leave": {
      const { data: member } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("character_id", character.id)
        .single();

      if (!member)
        return NextResponse.json(
          { error: "파티에 속해 있지 않습니다" },
          { status: 400 }
        );

      await supabase
        .from("party_members")
        .delete()
        .eq("party_id", member.party_id)
        .eq("character_id", character.id);

      return NextResponse.json({ ok: true, message: "파티를 나갔습니다" });
    }

    case "party_status": {
      const { data: member } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("character_id", character.id)
        .single();

      if (!member) return NextResponse.json({ ok: true, party: null });

      const { data: party } = await supabase
        .from("parties")
        .select("id, code, leader_id")
        .eq("id", member.party_id)
        .single();

      const { data: members } = await supabase
        .from("party_members")
        .select("character_id, characters(name)")
        .eq("party_id", member.party_id);

      return NextResponse.json({ ok: true, party, members });
    }

    case "get_party": {
      const { data: member } = await supabase
        .from("party_members")
        .select("party_id")
        .eq("character_id", character.id)
        .single();

      let memberCount = 0;
      if (member?.party_id) {
        const { count } = await supabase
          .from("party_members")
          .select("*", { count: "exact", head: true })
          .eq("party_id", member.party_id);
        memberCount = count ?? 0;
      }

      return NextResponse.json({
        ok: true,
        party_id: member?.party_id ?? null,
        member_count: memberCount,
      });
    }

    default:
      return NextResponse.json(
        { error: `알 수 없는 action: ${action}` },
        { status: 400 }
      );
  }
}
