"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [handle, setHandle] = useState("");
  const [charName, setCharName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient();

  // 세션 없으면 로그인으로
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("세션 만료. 다시 로그인해주세요.");

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: user.id,
        handle,
      });
      if (profileError) {
        if (profileError.code === "23505") throw new Error("이미 사용 중인 핸들입니다.");
        throw profileError;
      }

      const { error: charError } = await supabase.from("characters").insert({
        user_id: user.id,
        name: charName,
      });
      if (charError) throw charError;

      window.location.href = "/terminal";
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-green-800 p-6">
        <div className="text-green-400 text-sm mb-2 text-center font-mono">
          ╔══════════════════════════╗
        </div>
        <div className="text-green-400 text-sm mb-2 text-center font-mono">
          ║    INITIALIZING DEV      ║
        </div>
        <div className="text-green-400 text-sm mb-6 text-center font-mono">
          ╚══════════════════════════╝
        </div>

        <div className="text-green-600 text-xs mb-6 text-center">
          GitHub 계정으로 처음 접속하셨습니다.<br />
          핸들과 캐릭터명을 설정해주세요.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
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
              pattern="[a-zA-Z0-9_\-]+"
              title="영문, 숫자, _, - 만 허용"
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
            {loading ? "처리 중..." : "> ENTER THE STACK WORLD"}
          </button>
        </form>
      </div>
    </div>
  );
}
