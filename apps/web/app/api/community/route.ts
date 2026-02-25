// ============================================================
// STACKWORLD - API Route: /api/community
// 전역 채팅 + 친구 관계 관리
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: character } = await supabase
    .from("characters")
    .select("id, name")
    .eq("user_id", user.id)
    .single();
  if (!character) return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  // ──────────── 최근 채팅 조회 ────────────
  if (action === "recent") {
    const { data: messages } = await supabase
      .from("community_messages")
      .select("id, character_id, character_name, message, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    return NextResponse.json({
      ok: true,
      messages: (messages ?? []).reverse().map((m) => ({
        id: m.id,
        character_id: m.character_id,
        character_name: m.character_name,
        message: m.message,
        created_at: m.created_at,
        is_mine: m.character_id === character.id,
      })),
    });
  }

  // ──────────── 채팅 전송 ────────────
  if (action === "chat") {
    const msg = String(body.message ?? "").trim();
    if (!msg || msg.length > 200) {
      return NextResponse.json({ error: "메시지는 1~200자여야 합니다" }, { status: 400 });
    }
    const { error } = await supabase
      .from("community_messages")
      .insert({ character_id: character.id, character_name: character.name, message: msg });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ──────────── 친구 목록 조회 ────────────
  if (action === "friend_list") {
    // 내가 보낸 요청
    const { data: sent } = await supabase
      .from("friendships")
      .select("id, addressee_id, status, characters!friendships_addressee_id_fkey(name)")
      .eq("requester_id", character.id);

    // 내가 받은 요청
    const { data: received } = await supabase
      .from("friendships")
      .select("id, requester_id, status, characters!friendships_requester_id_fkey(name)")
      .eq("addressee_id", character.id);

    type CharRef = { name: string } | { name: string }[] | null;
    const resolveName = (ref: CharRef): string => {
      if (!ref) return "???";
      if (Array.isArray(ref)) return ref[0]?.name ?? "???";
      return ref.name ?? "???";
    };

    const friends = [
      ...(sent ?? [])
        .filter((f) => f.status === "accepted")
        .map((f) => ({
          id: f.id,
          character_id: f.addressee_id,
          name: resolveName(f.characters as CharRef),
        })),
      ...(received ?? [])
        .filter((f) => f.status === "accepted")
        .map((f) => ({
          id: f.id,
          character_id: f.requester_id,
          name: resolveName(f.characters as CharRef),
        })),
    ];

    const requests = (received ?? [])
      .filter((f) => f.status === "pending")
      .map((f) => ({
        id: f.id,
        character_id: f.requester_id,
        name: resolveName(f.characters as CharRef),
      }));

    return NextResponse.json({ ok: true, friends, requests });
  }

  // ──────────── 친구 추가 요청 ────────────
  if (action === "friend_add") {
    const targetName = String(body.name ?? "").trim();
    if (!targetName) return NextResponse.json({ error: "이름을 입력하세요" }, { status: 400 });

    const { data: target } = await supabase
      .from("characters")
      .select("id")
      .eq("name", targetName)
      .single();
    if (!target) return NextResponse.json({ error: `'${targetName}'을 찾을 수 없습니다` }, { status: 404 });
    if (target.id === character.id) {
      return NextResponse.json({ error: "자기 자신에게 친구 요청할 수 없습니다" }, { status: 400 });
    }

    // 이미 관계 있는지 확인
    const { data: existing } = await supabase
      .from("friendships")
      .select("id, status")
      .or(
        `and(requester_id.eq.${character.id},addressee_id.eq.${target.id}),` +
        `and(requester_id.eq.${target.id},addressee_id.eq.${character.id})`,
      )
      .single();

    if (existing) {
      const msg = existing.status === "accepted" ? "이미 친구입니다" : "이미 친구 요청이 존재합니다";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: character.id, addressee_id: target.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, message: `${targetName}에게 친구 요청을 보냈습니다` });
  }

  // ──────────── 친구 요청 수락 ────────────
  if (action === "friend_accept") {
    const targetName = String(body.name ?? "").trim();
    const { data: target } = await supabase
      .from("characters").select("id").eq("name", targetName).single();
    if (!target) return NextResponse.json({ error: `'${targetName}'을 찾을 수 없습니다` }, { status: 404 });

    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("requester_id", target.id)
      .eq("addressee_id", character.id)
      .eq("status", "pending");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, message: `${targetName}의 친구 요청을 수락했습니다` });
  }

  // ──────────── 친구 / 요청 삭제 ────────────
  if (action === "friend_remove") {
    const targetName = String(body.name ?? "").trim();
    const { data: target } = await supabase
      .from("characters").select("id").eq("name", targetName).single();
    if (!target) return NextResponse.json({ error: `'${targetName}'을 찾을 수 없습니다` }, { status: 404 });

    await supabase
      .from("friendships")
      .delete()
      .or(
        `and(requester_id.eq.${character.id},addressee_id.eq.${target.id}),` +
        `and(requester_id.eq.${target.id},addressee_id.eq.${character.id})`,
      );

    return NextResponse.json({ ok: true, message: `${targetName}을(를) 친구 목록에서 삭제했습니다` });
  }

  // ──────────── DM 전송 ────────────
  if (action === "dm_send") {
    const receiverName = String(body.name ?? "").trim();
    const msg = String(body.message ?? "").trim();
    if (!receiverName) return NextResponse.json({ error: "수신자를 지정하세요" }, { status: 400 });
    if (!msg || msg.length > 200) return NextResponse.json({ error: "메시지는 1~200자여야 합니다" }, { status: 400 });

    const { data: receiver } = await supabase
      .from("characters").select("id").eq("name", receiverName).single();
    if (!receiver) return NextResponse.json({ error: `'${receiverName}'을 찾을 수 없습니다` }, { status: 404 });
    if (receiver.id === character.id) return NextResponse.json({ error: "자기 자신에게 DM을 보낼 수 없습니다" }, { status: 400 });

    // 친구 관계 확인
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .or(
        `and(requester_id.eq.${character.id},addressee_id.eq.${receiver.id}),` +
        `and(requester_id.eq.${receiver.id},addressee_id.eq.${character.id})`,
      )
      .eq("status", "accepted")
      .single();
    if (!friendship) return NextResponse.json({ error: "친구에게만 DM을 보낼 수 있습니다" }, { status: 403 });

    const { error } = await supabase.from("direct_messages").insert({
      sender_id:   character.id,
      sender_name: character.name,
      receiver_id: receiver.id,
      message:     msg,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ──────────── DM 히스토리 조회 ────────────
  if (action === "dm_history") {
    const friendCharacterId = String(body.character_id ?? "").trim();
    if (!friendCharacterId) return NextResponse.json({ error: "character_id 필요" }, { status: 400 });

    const { data: messages } = await supabase
      .from("direct_messages")
      .select("id, sender_id, sender_name, message, created_at")
      .or(
        `and(sender_id.eq.${character.id},receiver_id.eq.${friendCharacterId}),` +
        `and(sender_id.eq.${friendCharacterId},receiver_id.eq.${character.id})`,
      )
      .order("created_at", { ascending: true })
      .limit(100);

    return NextResponse.json({
      ok: true,
      messages: (messages ?? []).map((m) => ({
        id:          m.id,
        sender_id:   m.sender_id,
        sender_name: m.sender_name,
        message:     m.message,
        created_at:  m.created_at,
        is_mine:     m.sender_id === character.id,
      })),
    });
  }

  return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
}
