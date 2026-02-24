import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (error === "no_character") {
    // 인증됐으나 캐릭터 없는 경우: 로그아웃 후 재가입 유도
    await supabase.auth.signOut();
    redirect("/login");
  }

  if (user) {
    redirect("/terminal");
  } else {
    redirect("/login");
  }
}
