"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [handle, setHandle] = useState("");
  const [charName, setCharName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient();

  // 이미 로그인된 유저는 terminal로 / 콜백 에러 표시
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/terminal";
    });
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get("error");
    if (errParam === "auth_failed") setError("GitHub 인증에 실패했습니다. 다시 시도해주세요.");
    else if (errParam === "missing_code") setError("OAuth 코드가 없습니다. 다시 시도해주세요.");
  }, []);

  async function handleGithubLogin() {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : "GitHub 로그인 오류");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignup) {
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signupError) throw signupError;
        if (!data.user) throw new Error("회원가입 실패");

        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          handle,
        });
        if (profileError) throw profileError;

        const { error: charError } = await supabase.from("characters").insert({
          user_id: data.user.id,
          name: charName,
        });
        if (charError) throw charError;

        // 회원가입 후 full reload로 세션 확실히 반영
        window.location.href = "/terminal";
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;

        // 로그인 후 full reload로 세션 확실히 반영
        window.location.href = "/terminal";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-green-800 p-6">
        {/* ASCII 로고 */}
        <div className="overflow-x-hidden mb-6">
          <pre className="text-green-400 text-[8px] text-center leading-tight">
{` _____ _____ _____ _____ _   _ _ _ _____  _____  _     ____
/  ___|_   _|  _  /  __ \\ | | | | |  _  ||  __ \\| |   |  _ \\
\\ \`--.  | | | | | | /  \\/ | | | | | | | || |__/ /| |   | | | |
 \`--. \\ | | | | | | |   | '_' | | | | | ||    / | |   | | | |
/\\__/ / | | \\ \\_/ / \\__/\\| ._. | | \\ \\_/ /| |\\ \\ | |___| |_/ /
\\____/  \\_/  \\___/ \\____/\\_| |_/_/  \\___/ \\_| \\_\\_____/____/`}
          </pre>
        </div>

        <div className="text-green-600 text-xs mb-4 text-center">
          터미널 기반 협동/경쟁 개발자 RPG
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setIsSignup(false); setError(""); }}
            className={`flex-1 py-1 text-sm border ${!isSignup ? "border-green-400 text-green-400" : "border-green-900 text-green-800"}`}
          >
            LOGIN
          </button>
          <button
            onClick={() => { setIsSignup(true); setError(""); }}
            className={`flex-1 py-1 text-sm border ${isSignup ? "border-green-400 text-green-400" : "border-green-900 text-green-800"}`}
          >
            SIGNUP
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-green-600 text-xs">EMAIL:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-green-900 text-green-400 px-2 py-1 text-sm focus:border-green-500 outline-none mt-1"
              placeholder="dev@company.com"
              required
            />
          </div>
          <div>
            <label className="text-green-600 text-xs">PASSWORD:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-green-900 text-green-400 px-2 py-1 text-sm focus:border-green-500 outline-none mt-1"
              placeholder="••••••••"
              required
            />
          </div>

          {isSignup && (
            <>
              <div>
                <label className="text-green-600 text-xs">HANDLE (닉네임):</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-black border border-green-900 text-green-400 px-2 py-1 text-sm focus:border-green-500 outline-none mt-1"
                  placeholder="dev_master"
                  minLength={2}
                  maxLength={20}
                  required
                />
              </div>
              <div>
                <label className="text-green-600 text-xs">CHARACTER NAME:</label>
                <input
                  type="text"
                  value={charName}
                  onChange={(e) => setCharName(e.target.value)}
                  className="w-full bg-black border border-green-900 text-green-400 px-2 py-1 text-sm focus:border-green-500 outline-none mt-1"
                  placeholder="StackMaster"
                  minLength={2}
                  maxLength={20}
                  required
                />
              </div>
            </>
          )}

          {error && (
            <div className="text-red-400 text-xs border border-red-900 px-2 py-1">
              ERROR: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 border border-green-500 text-green-400 text-sm hover:bg-green-900/20 disabled:opacity-50 mt-2"
          >
            {loading ? "처리 중..." : isSignup ? "> CREATE ACCOUNT" : "> LOGIN"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-green-900" />
          <span className="text-green-800 text-xs">OR</span>
          <div className="flex-1 border-t border-green-900" />
        </div>

        <button
          onClick={handleGithubLogin}
          disabled={loading}
          className="w-full py-2 border border-green-800 text-green-600 text-sm hover:border-green-500 hover:text-green-400 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
          </svg>
          &gt; LOGIN WITH GITHUB
        </button>
      </div>
    </div>
  );
}
