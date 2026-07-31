"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkLogin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(!!session);
      setLoading(false);
    }

    checkLogin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("로그아웃에 실패했습니다.");
      console.log(error);
      return;
    }

    setIsLoggedIn(false);
    alert("로그아웃되었습니다.");
  }

  if (loading) {
    return (
      <span className="rounded-lg bg-gray-300 px-4 py-2 text-gray-600">
        확인 중
      </span>
    );
  }

  if (isLoggedIn) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg bg-gray-700 px-4 py-2 text-white"
      >
        로그아웃
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-lg bg-blue-500 px-4 py-2 text-white"
    >
      로그인
    </Link>
  );
}