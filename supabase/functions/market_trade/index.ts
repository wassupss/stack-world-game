// ============================================================
// STACKWORLD - Edge Function: market_trade
// 즉시구매 + 계약 납품 경제 시스템
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const { data: character } = await admin
    .from("characters")
    .select("id, credits")
    .eq("user_id", user.id)
    .single();
  if (!character) return json({ error: "캐릭터 없음" }, 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "잘못된 JSON" }, 400);
  }

  const parsed = MarketTradeSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "입력 오류", details: parsed.error.flatten() }, 400);
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
    return json({ error: "서버 오류" }, 500);
  }
});

// ──────────── sell ────────────
async function handleSell(
  db: ReturnType<typeof createClient>,
  character: { id: string; credits: number },
  input: Extract<z.infer<typeof MarketTradeSchema>, { action: "sell" }>,
) {
  // 인벤토리 확인
  const { data: inv } = await db
    .from("inventory")
    .select("qty")
    .eq("character_id", character.id)
    .eq("artifact_key", input.artifact_key)
    .single();

  if (!inv || inv.qty < input.qty) {
    return json({ error: `인벤토리 부족: ${input.artifact_key} ${input.qty}개 필요` }, 400);
  }

  // 인벤토리 차감
  await db.from("inventory").update({ qty: inv.qty - input.qty })
    .eq("character_id", character.id)
    .eq("artifact_key", input.artifact_key);

  // 마켓 리스팅 생성
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

  return json({
    ok: true,
    result: {
      listing_id: listing?.id,
      message: `[마켓 등록] ${input.artifact_key} x${input.qty} @ ${input.price_credits}cr`,
    },
  });
}

// ──────────── buy ────────────
async function handleBuy(
  db: ReturnType<typeof createClient>,
  character: { id: string; credits: number },
  input: Extract<z.infer<typeof MarketTradeSchema>, { action: "buy" }>,
) {
  const { data: listing } = await db
    .from("market_listings")
    .select("*")
    .eq("id", input.listing_id)
    .eq("is_active", true)
    .single();

  if (!listing) return json({ error: "리스팅을 찾을 수 없습니다" }, 404);
  if (listing.seller_id === character.id) return json({ error: "본인 리스팅은 구매 불가" }, 400);

  // 현재 크레딧 재확인
  const { data: buyer } = await db
    .from("characters")
    .select("credits")
    .eq("id", character.id)
    .single();

  if (!buyer || buyer.credits < listing.price_credits) {
    return json({ error: `크레딧 부족 (보유: ${buyer?.credits ?? 0}, 필요: ${listing.price_credits})` }, 400);
  }

  // 트랜잭션: 크레딧 이전 + 리스팅 비활성화 + 인벤토리 추가
  // 구매자 크레딧 차감
  await db.from("characters").update({ credits: buyer.credits - listing.price_credits })
    .eq("id", character.id);

  // 판매자 크레딧 지급
  await db.rpc("grant_credits", {
    p_character_id: listing.seller_id,
    p_amount: listing.price_credits,
  });

  // 리스팅 비활성화
  await db.from("market_listings").update({ is_active: false })
    .eq("id", input.listing_id);

  // 구매자 인벤토리 추가
  await db.rpc("add_inventory", {
    p_character_id: character.id,
    p_artifact_key: listing.artifact_key,
    p_qty: listing.qty,
  });

  return json({
    ok: true,
    result: {
      artifact_key: listing.artifact_key,
      qty: listing.qty,
      paid: listing.price_credits,
      message: `[구매 완료] ${listing.artifact_key} x${listing.qty} (${listing.price_credits}cr 지출)`,
    },
  });
}

// ──────────── deliver (계약 납품) ────────────
async function handleDeliver(
  db: ReturnType<typeof createClient>,
  character: { id: string; credits: number },
  input: Extract<z.infer<typeof MarketTradeSchema>, { action: "deliver" }>,
) {
  const { data: contract } = await db
    .from("contracts")
    .select("*")
    .eq("id", input.contract_id)
    .is("filled_by", null)
    .single();

  if (!contract) return json({ error: "계약을 찾을 수 없습니다 (완료됐거나 존재하지 않음)" }, 404);

  // 만료 체크
  if (new Date(contract.expires_at) < new Date()) {
    return json({ error: "만료된 계약입니다" }, 400);
  }

  // 인벤토리 확인
  const { data: inv } = await db
    .from("inventory")
    .select("qty")
    .eq("character_id", character.id)
    .eq("artifact_key", contract.target_artifact_key)
    .single();

  if (!inv || inv.qty < contract.qty_required) {
    return json({
      error: `납품 불가: ${contract.target_artifact_key} ${contract.qty_required}개 필요 (보유: ${inv?.qty ?? 0})`,
    }, 400);
  }

  // 인벤토리 차감
  await db.from("inventory").update({ qty: inv.qty - contract.qty_required })
    .eq("character_id", character.id)
    .eq("artifact_key", contract.target_artifact_key);

  // 계약 완료 처리
  await db.from("contracts").update({
    filled_by: character.id,
  }).eq("id", input.contract_id);

  // 보상 지급
  await db.rpc("grant_credits", {
    p_character_id: character.id,
    p_amount: contract.reward_credits,
  });

  // XP 보상
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

  return json({
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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
