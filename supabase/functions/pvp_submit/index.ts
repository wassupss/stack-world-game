// ============================================================
// STACKWORLD - Edge Function: pvp_submit
// PvP 점수 서버 계산 + 리더보드 업데이트 (idempotent)
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// ──────────── PvP 점수 공식 ────────────
// Code Golf: (1000 / cmd_count) * (quality / 100) - (debt * 10) - (elapsed_sec * 0.1)
// Speedrun:  (10000 / elapsed_sec) * (quality / 100) - (debt * 20)
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
  run_id: z.string().uuid(),
  idempotency_key: z.string().min(1).max(128),
});

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
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!character) return json({ error: "캐릭터 없음" }, 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "잘못된 JSON" }, 400);
  }

  const parsed = PvpSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "입력 오류", details: parsed.error.flatten() }, 400);
  }

  const { match_id, run_id, idempotency_key } = parsed.data;

  // Idempotency: 이미 제출한 경우
  const { data: existingEntry } = await admin
    .from("pvp_entries")
    .select("id, score")
    .eq("match_id", match_id)
    .eq("character_id", character.id)
    .single();
  if (existingEntry) {
    return json({ ok: true, cached: true, score: existingEntry.score });
  }

  // 매치 조회
  const { data: match } = await admin
    .from("pvp_matches")
    .select("mode, seed, season_id, status")
    .eq("id", match_id)
    .single();
  if (!match) return json({ error: "매치를 찾을 수 없습니다" }, 404);
  if (match.status !== "active") return json({ error: "진행 중인 매치가 아닙니다" }, 400);

  // 런 데이터 조회 (클라이언트가 제출한 run_id로 서버에서 직접 계산)
  const { data: run } = await admin
    .from("runs")
    .select("character_id, seed, status, quality, debt, cmd_count, started_at, ended_at")
    .eq("id", run_id)
    .single();

  if (!run) return json({ error: "런을 찾을 수 없습니다" }, 404);
  if (run.character_id !== character.id) return json({ error: "본인의 런만 제출 가능합니다" }, 403);
  if (run.status !== "completed") return json({ error: "완료된 런만 제출 가능합니다" }, 400);
  if (run.seed !== match.seed) return json({ error: "시드 불일치: 해당 매치 시드로 진행한 런이 아닙니다" }, 400);

  // 경과 시간 계산
  const elapsed_sec = run.ended_at && run.started_at
    ? Math.floor((new Date(run.ended_at).getTime() - new Date(run.started_at).getTime()) / 1000)
    : 9999;

  // 서버 측 점수 계산 (클라이언트 제출값 무시)
  let score: number;
  if (match.mode === "golf") {
    score = calcGolfScore({
      command_count: run.cmd_count,
      quality: run.quality,
      debt: run.debt,
      elapsed_sec,
    });
  } else {
    score = calcSpeedrunScore({
      elapsed_sec,
      quality: run.quality,
      debt: run.debt,
    });
  }

  // PvP 엔트리 삽입
  await admin.from("pvp_entries").insert({
    match_id,
    character_id: character.id,
    run_id,
    score,
    command_count: run.cmd_count,
    elapsed_sec,
    quality: run.quality,
    debt_penalty: match.mode === "golf" ? run.debt * 10 : run.debt * 20,
    submitted_at: new Date().toISOString(),
  });

  // 리더보드 업데이트 (idempotent upsert)
  if (match.season_id) {
    await admin.from("leaderboards").upsert({
      season_id: match.season_id,
      mode: match.mode,
      character_id: character.id,
      total_score: score,
      match_count: 1,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "season_id,mode,character_id",
      ignoreDuplicates: false,
    });

    // 실제 배포에서는 RPC로 atomic increment 처리
    await admin.rpc("increment_leaderboard", {
      p_season_id: match.season_id,
      p_mode: match.mode,
      p_character_id: character.id,
      p_score: score,
    });
  }

  // 전체 순위 재계산 (match 완료 시)
  const { count: submittedCount } = await admin
    .from("pvp_entries")
    .select("*", { count: "exact", head: true })
    .eq("match_id", match_id)
    .not("submitted_at", "is", null);

  const result = {
    match_id,
    score,
    mode: match.mode,
    breakdown:
      match.mode === "golf"
        ? {
          cmd_count: run.cmd_count,
          quality: run.quality,
          debt: run.debt,
          elapsed_sec,
        }
        : {
          elapsed_sec,
          quality: run.quality,
          debt: run.debt,
        },
    participants: submittedCount,
    message: `[PvP 제출 완료] 점수: ${score}`,
  };

  return json({ ok: true, result });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
