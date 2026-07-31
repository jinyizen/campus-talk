"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!nickname || !email || !password) {
      alert("닉네임, 이메일, 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname,
        },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("회원가입이 완료되었습니다. 이메일 인증 후 로그인해 주세요.");
  }

  async function handleLogin() {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("로그인되었습니다.");
    window.location.href = "/";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow">
        <Link
  href="/"
  className="mb-4 inline-block text-blue-500 hover:underline"
>
  ← 목록으로
</Link>
        <h1 className="text-2xl font-bold">로그인 / 회원가입</h1>

        <input
          type="text"
          placeholder="닉네임 (회원가입할 때만 입력)"
          className="mt-6 w-full rounded-lg border p-3"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <input
          type="email"
          placeholder="이메일"
          className="mt-3 w-full rounded-lg border p-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="비밀번호"
          className="mt-3 w-full rounded-lg border p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-blue-500 py-3 text-white disabled:opacity-50"
        >
          {loading ? "처리 중..." : "로그인"}
        </button>

        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          className="mt-3 w-full rounded-lg border py-3 disabled:opacity-50"
        >
          {loading ? "처리 중..." : "회원가입"}
        </button>
      </div>
    </main>
  );
}