"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Post = {
  id: number;
  title: string;
  created_at: string;
};

export default function MyPage() {
  const [nickname, setNickname] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();

      setNickname(profile?.nickname ?? "사용자");

      const { data: myPosts } = await supabase
        .from("posts")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setPosts((myPosts ?? []) as Post[]);

      const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setCommentCount(count ?? 0);

      setLoading(false);
    }

    fetchMyPage();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        불러오는 중...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-3xl font-bold">내정보</h1>

        {!nickname ? (
          <div className="rounded-xl bg-white p-6 text-center">
            <p className="mb-4">로그인이 필요합니다.</p>

            <Link
              href="/login"
              className="rounded-lg bg-blue-500 px-5 py-3 text-white"
            >
              로그인
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-xl bg-white p-5">
              <p className="text-sm text-gray-500">닉네임</p>
              <p className="text-2xl font-bold">{nickname}</p>

              <div className="mt-4 flex gap-5">
                <span>📝 글 {posts.length}</span>
                <span>💬 댓글 {commentCount}</span>
              </div>
            </div>

            <h2 className="mb-3 text-xl font-bold">내가 쓴 글</h2>

            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="rounded-xl bg-white p-5 text-center text-gray-500">
                  작성한 글이 없습니다.
                </div>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="block rounded-xl bg-white p-4 hover:bg-gray-50"
                  >
                    <p className="font-semibold">{post.title}</p>

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleString("ko-KR")}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}