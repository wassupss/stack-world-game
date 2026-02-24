import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import TerminalShell from "@/components/terminal/TerminalShell";

export default async function TerminalPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 캐릭터 데이터 서버에서 조회
  const { data: character } = await supabase
    .from("characters")
    .select("id, name, credits")
    .eq("user_id", user.id)
    .single();

  if (!character) {
    // 로그인됐으나 캐릭터 없음 → login으로 가면 middleware와 loop 발생
    // 대신 에러 페이지로 이동하거나 재가입 유도
    redirect("/?error=no_character");
  }

  const { data: positionMastery } = await supabase
    .from("position_mastery")
    .select("position, level, xp")
    .eq("character_id", character.id);

  const { data: coreMastery } = await supabase
    .from("core_mastery")
    .select("core, level, xp")
    .eq("character_id", character.id);

  return (
    <TerminalShell
      character={character}
      positionMastery={positionMastery ?? []}
      coreMastery={coreMastery ?? []}
    />
  );
}
