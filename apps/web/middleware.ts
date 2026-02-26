import { createServerClient } from "@supabase/ssr";
import { type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // request 쿠키 업데이트 (이후 Server Component에서 읽을 수 있도록)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 갱신된 response 생성 및 쿠키 반영
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 시도 — 만료된 refresh token은 여기서 정리됨
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  // 비인증 유저가 보호된 경로 접근 시 login으로
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 인증된 유저의 login 페이지 접근은 page.tsx(/) 에서 처리
  // 여기서 redirect하면 terminal page → /login redirect와 loop 발생 가능

  return supabaseResponse;
}

export const config = {
  matcher: [
    // 정적 파일·이미지 제외, 나머지 모든 경로에 적용
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
