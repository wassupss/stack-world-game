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

  // 이미 로그인된 유저는 terminal로
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/terminal";
    });
  }, []);

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
      </div>
    </div>
  );
}
