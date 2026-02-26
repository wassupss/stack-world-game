// ============================================================
// STACKWORLD - API Route: /api/shop-command
// 상점 조회 / 아이템 구매 / 소모품 사용 (Edge Function 직접 이식)
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type DB = ReturnType<typeof createAdminClient>;

const ShopCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({
    action:           z.literal("buy"),
    item_key:         z.string().min(1),
    idempotency_key:  z.string().min(1).max(128),
  }),
  z.object({
    action:   z.literal("use"),
    item_key: z.string().min(1),
  }),
  z.object({
    action:   z.literal("equip"),
    item_key: z.string().min(1),
  }),
  z.object({
    action: z.literal("unequip"),
  }),
  z.object({
    action:    z.literal("skill"),
    skill_key: z.string().min(1),
  }),
]);

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createAdminClient();

  const { data: char } = await svc
    .from("characters")
    .select("id, credits, queued_modifier")
    .eq("user_id", user.id)
    .single();
  if (!char) return NextResponse.json({ error: "캐릭터가 없습니다" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid JSON" }, { status: 400 }); }

  const parsed = ShopCommandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const input = parsed.data;

  // ──────────── list ────────────
  if (input.action === "list") {
    const [itemsRes, upgradesRes, charItemsRes] = await Promise.all([
      svc.from("shop_items").select("*").order("item_type").order("price"),
      svc.from("character_upgrades").select("item_key, level").eq("character_id", char.id),
      svc.from("character_items").select("item_key, qty").eq("character_id", char.id),
    ]);

    const upgradeMap = Object.fromEntries(
      (upgradesRes.data ?? []).map((u: { item_key: string; level: number }) => [u.item_key, u.level])
    );
    const itemMap = Object.fromEntries(
      (charItemsRes.data ?? []).map((i: { item_key: string; qty: number }) => [i.item_key, i.qty])
    );

    const items = (itemsRes.data ?? []).map((item: Record<string, unknown>) => ({
      ...item,
      owned_level: upgradeMap[item.item_key as string] ?? null,
      owned_qty:   itemMap[item.item_key as string] ?? 0,
    }));

    return NextResponse.json({
      result: {
        credits: char.credits,
        queued_modifier: char.queued_modifier,
        items,
      },
    });
  }

  // ──────────── buy ────────────
  if (input.action === "buy") {
    const { data: existingCmd } = await svc
      .from("run_commands")
      .select("id")
      .eq("character_id", char.id)
      .eq("idempotency_key", input.idempotency_key)
      .single();
    if (existingCmd) return NextResponse.json({ result: { message: "이미 처리된 요청입니다" } });

    const { data: item } = await svc
      .from("shop_items")
      .select("*")
      .eq("item_key", input.item_key)
      .single();
    if (!item) return NextResponse.json({ error: `아이템을 찾을 수 없습니다: ${input.item_key}` }, { status: 404 });

    let currentLevel = 0;
    if (item.item_type === "upgrade" || item.item_type === "skill") {
      const { data: existUpgrade } = await svc
        .from("character_upgrades")
        .select("level")
        .eq("character_id", char.id)
        .eq("item_key", input.item_key)
        .single();
      currentLevel = existUpgrade?.level ?? 0;
      if (currentLevel >= item.max_level) {
        return NextResponse.json({ error: `이미 최대 레벨입니다 (${item.max_level}레벨)` }, { status: 400 });
      }
    }

    const price = item.item_type === "upgrade"
      ? Math.floor(item.price * Math.pow(1.1, currentLevel))
      : item.price;

    if (char.credits < price) {
      return NextResponse.json({ error: `크레딧 부족 (필요: ${price}cr, 보유: ${char.credits}cr)` }, { status: 400 });
    }

    await svc
      .from("characters")
      .update({ credits: char.credits - price })
      .eq("id", char.id);

    if (item.item_type === "upgrade" || item.item_type === "skill") {
      await svc
        .from("character_upgrades")
        .upsert(
          { character_id: char.id, item_key: input.item_key, level: currentLevel + 1 },
          { onConflict: "character_id,item_key" }
        );
    } else {
      const { data: existItem } = await svc
        .from("character_items")
        .select("qty")
        .eq("character_id", char.id)
        .eq("item_key", input.item_key)
        .single();

      await svc
        .from("character_items")
        .upsert(
          { character_id: char.id, item_key: input.item_key, qty: (existItem?.qty ?? 0) + 1 },
          { onConflict: "character_id,item_key" }
        );
    }

    await svc.from("run_commands").insert({
      character_id:    char.id,
      idempotency_key: input.idempotency_key,
      command:         `shop_buy:${input.item_key}`,
      args:            {},
    });

    const newCredits = char.credits - price;
    return NextResponse.json({
      result: {
        message: `[${item.name}] 구매 완료`,
        item_key: input.item_key,
        item_type: item.item_type,
        credits_spent: price,
        credits_remaining: newCredits,
        new_level: (item.item_type === "upgrade" || item.item_type === "skill")
          ? currentLevel + 1 : null,
      },
    });
  }

  // ──────────── equip (수식어 장착) ────────────
  if (input.action === "equip") {
    const { data: item } = await svc
      .from("shop_items")
      .select("item_key, name, item_type")
      .eq("item_key", input.item_key)
      .single();
    if (!item || item.item_type !== "modifier") {
      return NextResponse.json({ error: "modifier 타입의 아이템만 장착 가능합니다" }, { status: 400 });
    }

    const { data: charItem } = await svc
      .from("character_items")
      .select("qty")
      .eq("character_id", char.id)
      .eq("item_key", input.item_key)
      .single();
    if (!charItem || charItem.qty <= 0) {
      return NextResponse.json({ error: "보유한 아이템이 없습니다" }, { status: 400 });
    }

    await svc
      .from("characters")
      .update({ queued_modifier: input.item_key })
      .eq("id", char.id);

    return NextResponse.json({ result: { message: `[${item.name}] 장착 완료. 다음 런 시작 시 적용됩니다.`, queued_modifier: input.item_key } });
  }

  // ──────────── unequip ────────────
  if (input.action === "unequip") {
    await svc.from("characters").update({ queued_modifier: null }).eq("id", char.id);
    return NextResponse.json({ result: { message: "수식어 해제 완료" } });
  }

  // ──────────── use (소모품 → 현재 런에 적용) ────────────
  if (input.action === "use") {
    return await handleUse(svc, char, input.item_key);
  }

  // ──────────── skill ────────────
  if (input.action === "skill") {
    return await handleSkill(svc, char, input.skill_key);
  }

  return NextResponse.json({ error: "알 수 없는 action" }, { status: 400 });
}

async function handleUse(
  svc: DB,
  char: { id: string; credits: number; queued_modifier?: string | null },
  item_key: string,
) {
  const { data: item } = await svc
    .from("shop_items")
    .select("*")
    .eq("item_key", item_key)
    .single();
  if (!item) return NextResponse.json({ error: `아이템을 찾을 수 없습니다: ${item_key}` }, { status: 404 });
  if (item.item_type !== "consumable") {
    return NextResponse.json({ error: "consumable 타입의 아이템만 use 가능합니다. modifier는 equip 커맨드를 사용하세요." }, { status: 400 });
  }

  const { data: charItem } = await svc
    .from("character_items")
    .select("qty")
    .eq("character_id", char.id)
    .eq("item_key", item_key)
    .single();
  if (!charItem || charItem.qty <= 0) return NextResponse.json({ error: "보유한 아이템이 없습니다" }, { status: 400 });

  const { data: run } = await svc
    .from("runs")
    .select("id, time, risk, debt, quality, active_effects")
    .eq("character_id", char.id)
    .eq("status", "active")
    .single();
  if (!run) return NextResponse.json({ error: "활성 런이 없습니다. 소모품은 런 중에만 사용 가능합니다" }, { status: 400 });

  const effect = item.effect_data as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  const messages: string[] = [];

  if (effect.time_bonus) {
    updates.time = Math.min(100, (run.time as number) + (effect.time_bonus as number));
    messages.push(`TIME +${effect.time_bonus}`);
  }
  if (effect.quality_bonus) {
    updates.quality = Math.min(100, (run.quality as number) + (effect.quality_bonus as number));
    messages.push(`QUAL +${effect.quality_bonus}`);
  }
  if (effect.debt_reduction) {
    updates.debt = Math.max(0, (run.debt as number) - (effect.debt_reduction as number));
    messages.push(`DEBT -${effect.debt_reduction}`);
  }
  if (effect.effect) {
    const newEffect = effect.effect as { type: string; magnitude: number; turns_left: number };
    const currentEffects = (run.active_effects as unknown[]) ?? [];
    const merged = [
      ...currentEffects.filter((e: unknown) => (e as { type: string }).type !== newEffect.type),
      newEffect,
    ];
    updates.active_effects = merged;
    messages.push(`${newEffect.type.toUpperCase()} ${newEffect.turns_left}턴 적용`);
  }

  if (Object.keys(updates).length > 0) {
    await svc.from("runs").update(updates).eq("id", run.id);
  }

  await svc
    .from("character_items")
    .update({ qty: charItem.qty - 1 })
    .eq("character_id", char.id)
    .eq("item_key", item_key);

  return NextResponse.json({
    result: {
      message: `[${item.name}] 사용 완료: ${messages.join(", ")}`,
      item_key: item_key,
      effects_applied: messages,
      resources: {
        time: updates.time ?? run.time,
        risk: run.risk,
        debt: updates.debt ?? run.debt,
        quality: updates.quality ?? run.quality,
      },
      active_effects: updates.active_effects ?? run.active_effects,
    },
  });
}

async function handleSkill(
  svc: DB,
  char: { id: string; credits: number; queued_modifier?: string | null },
  skill_key: string,
) {
  const { data: upgrade } = await svc
    .from("character_upgrades")
    .select("level")
    .eq("character_id", char.id)
    .eq("item_key", skill_key)
    .single();
  if (!upgrade) return NextResponse.json({ error: `스킬 미보유: ${skill_key}. shop buy로 먼저 구매하세요.` }, { status: 400 });

  const { data: skillItem } = await svc
    .from("shop_items")
    .select("*")
    .eq("item_key", skill_key)
    .single();
  if (!skillItem || skillItem.item_type !== "skill") {
    return NextResponse.json({ error: "skill 타입의 아이템이 아닙니다" }, { status: 400 });
  }

  const { data: run } = await svc
    .from("runs")
    .select("id, time, risk, debt, quality, active_effects, skill_cooldowns")
    .eq("character_id", char.id)
    .eq("status", "active")
    .single();
  if (!run) return NextResponse.json({ error: "활성 런이 없습니다" }, { status: 400 });

  const effectDef = skillItem.effect_data as Record<string, unknown>;
  const cooldownWorks = (effectDef.cooldown_works as number) ?? 5;
  const cooldownMs = cooldownWorks * 30_000;
  const cooldowns = (run.skill_cooldowns as Record<string, number>) ?? {};
  const lastUsedAt = cooldowns[skill_key] ?? 0;
  const now = Date.now();
  if (now - lastUsedAt < cooldownMs) {
    const remaining = Math.ceil((cooldownMs - (now - lastUsedAt)) / 1000);
    return NextResponse.json({ error: `쿨다운 중입니다. ${remaining}초 후 사용 가능` }, { status: 400 });
  }

  const effect = effectDef.effect as Record<string, number> ?? {};
  const updates: Record<string, unknown> = {
    skill_cooldowns: { ...cooldowns, [skill_key]: now },
  };
  const messages: string[] = [];

  if (effect.debt_reduction) {
    updates.debt = Math.max(0, (run.debt as number) - effect.debt_reduction);
    messages.push(`DEBT -${effect.debt_reduction}`);
  }
  if (effect.risk_reduction) {
    updates.risk = Math.max(0, (run.risk as number) - effect.risk_reduction);
    messages.push(`RISK -${effect.risk_reduction}`);
  }
  if (effect.quality_bonus) {
    updates.quality = Math.min(100, (run.quality as number) + effect.quality_bonus);
    messages.push(`QUAL +${effect.quality_bonus}`);
  }

  await svc.from("runs").update(updates).eq("id", run.id);

  return NextResponse.json({
    result: {
      message: `[${skillItem.name}] 스킬 사용: ${messages.join(", ")}`,
      skill_key: skill_key,
      effects_applied: messages,
      cooldown_seconds: cooldownMs / 1000,
      resources: {
        time: run.time,
        risk: updates.risk ?? run.risk,
        debt: updates.debt ?? run.debt,
        quality: updates.quality ?? run.quality,
      },
    },
  });
}
