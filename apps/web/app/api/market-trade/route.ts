// ============================================================
// STACKWORLD - API Route: /api/market-trade
// 즉시구매 + 계약 납품 경제 시스템 (Edge Function 직접 이식)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type DB = ReturnType<typeof createAdminClient>;

const MarketTradeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("sell"),
    artifact_key: z.string().min(1),
    qty: z.number().int().min(1),
    price_credits: z.number().int().min(1),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("buy"),
    listing_id: z.string().uuid(),
    idempotency_key: z.string().min(1).max(128),
  }),
  z.object({
    action: z.literal("deliver"),
    contract_id: z.string().uuid(),
    idempotency_key: z.string().min(1).max(128),
  }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: character } = await admin
    .from("characters")
    .select("id, credits")
    .eq("user_id", user.id)
    .single();
  if (!character) return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON" }, { status: 400 });
  }

  const parsed = MarketTradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력 오류", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    switch (parsed.data.action) {
      case "sell":
        return await handleSell(admin, character, parsed.data);
      case "buy":
        return await handleBuy(admin, character, parsed.data);
      case "deliver":
        return await handleDeliver(admin, character, parsed.data);
    }
  } catch (e) {
    console.error("market_trade error:", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}

async function handleSell(
  db: DB,
  character: { id: string; credits: number },
  input: Extract<z.infer<typeof MarketTradeSchema>, { action: "sell" }>,
) {
  const { data: inv } = await db
    .from("inventory")
    .select("qty")
    .eq("character_id", character.id)
    .eq("artifact_key", input.artifact_key)
    .single();

  if (!inv || inv.qty < input.qty) {
    return NextResponse.json({ error: `인벤토리 부족: ${input.artifact_key} ${input.qty}개 필요` }, { status: 400 });
  }

  await db.from("inventory").update({ qty: inv.qty - input.qty })
    .eq("character_id", character.id)
    .eq("artifact_key", input.artifact_key);

  const { data: listing } = await db
    .from("market_listings")
    .insert({
      seller_id: character.id,
      artifact_key: input.artifact_key,
      qty: input.qty,
      price_credits: input.price_credits,
    })
    .select("id")
    .single();

  return NextResponse.json({
    ok: true,
    result: {
      listing_id: listing?.id,
      message: `[마켓 등록] ${input.artifact_key} x${input.qty} @ ${input.price_credits}cr`,
    },
  });
}

async function handleBuy(
  db: DB,
  character: { id: string; credits: number },
  input: Extract<z.infer<typeof MarketTradeSchema>, { action: "buy" }>,
) {
  const { data: listing } = await db
    .from("market_listings")
    .select("*")
    .eq("id", input.listing_id)
    .eq("is_active", true)
    .single();

  if (!listing) return NextResponse.json({ error: "리스팅을 찾을 수 없습니다" }, { status: 404 });
  if (listing.seller_id === character.id) return NextResponse.json({ error: "본인 리스팅은 구매 불가" }, { status: 400 });

  const { data: buyer } = await db
    .from("characters")
    .select("credits")
    .eq("id", character.id)
    .single();

  if (!buyer || buyer.credits < listing.price_credits) {
    return NextResponse.json({ error: `크레딧 부족 (보유: ${buyer?.credits ?? 0}, 필요: ${listing.price_credits})` }, { status: 400 });
  }

  await db.from("characters").update({ credits: buyer.credits - listing.price_credits })
    .eq("id", character.id);

  await db.rpc("grant_credits", {
    p_character_id: listing.seller_id,
    p_amount: listing.price_credits,
  });

  await db.from("market_listings").update({ is_active: false })
    .eq("id", input.listing_id);

  await db.rpc("add_inventory", {
    p_character_id: character.id,
    p_artifact_key: listing.artifact_key,
    p_qty: listing.qty,
  });

  return NextResponse.json({
    ok: true,
    result: {
      artifact_key: listing.artifact_key,
      qty: listing.qty,
      paid: listing.price_credits,
      message: `[구매 완료] ${listing.artifact_key} x${listing.qty} (${listing.price_credits}cr 지출)`,
    },
  });
}

async function handleDeliver(
  db: DB,
  character: { id: string; credits: number },
  input: Extract<z.infer<typeof MarketTradeSchema>, { action: "deliver" }>,
) {
  const { data: contract } = await db
    .from("contracts")
    .select("*")
    .eq("id", input.contract_id)
    .is("filled_by", null)
    .single();

  if (!contract) return NextResponse.json({ error: "계약을 찾을 수 없습니다 (완료됐거나 존재하지 않음)" }, { status: 404 });

  if (new Date(contract.expires_at) < new Date()) {
    return NextResponse.json({ error: "만료된 계약입니다" }, { status: 400 });
  }

  const { data: inv } = await db
    .from("inventory")
    .select("qty")
    .eq("character_id", character.id)
    .eq("artifact_key", contract.target_artifact_key)
    .single();

  if (!inv || inv.qty < contract.qty_required) {
    return NextResponse.json({
      error: `납품 불가: ${contract.target_artifact_key} ${contract.qty_required}개 필요 (보유: ${inv?.qty ?? 0})`,
    }, { status: 400 });
  }

  await db.from("inventory").update({ qty: inv.qty - contract.qty_required })
    .eq("character_id", character.id)
    .eq("artifact_key", contract.target_artifact_key);

  await db.from("contracts").update({
    filled_by: character.id,
  }).eq("id", input.contract_id);

  await db.rpc("grant_credits", {
    p_character_id: character.id,
    p_amount: contract.reward_credits,
  });

  if (contract.reward_xp) {
    const xp = contract.reward_xp as { position?: Record<string, number>; core?: Record<string, number> };
    if (xp.position) {
      for (const [pos, amount] of Object.entries(xp.position)) {
        await db.rpc("grant_position_xp", {
          p_character_id: character.id,
          p_position: pos,
          p_xp: amount,
        });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    result: {
      contract_id: input.contract_id,
      artifact_delivered: contract.target_artifact_key,
      qty: contract.qty_required,
      reward_credits: contract.reward_credits,
      message: `[계약 납품 완료] +${contract.reward_credits}cr`,
    },
  });
}
