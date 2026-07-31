"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthButton from "./components/AuthButton";

type Post = {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
};

type Profile = {
  id: string;
  nickname: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nicknameMap, setNicknameMap] = useState<Map<string, string>>(
    new Map()
  );
  const [likeCountMap, setLikeCountMap] = useState<Map<number, number>>(
    new Map()
  );
  const [commentCountMap, setCommentCountMap] = useState<Map<number, number>>(
    new Map()
  );

  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortType, setSortType] = useState<"latest" | "popular">("latest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomeData() {
      setLoading(true);

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postError) {
        console.error("게시글 불러오기 오류:", postError);
        setLoading(false);
        return;
      }

      const loadedPosts = (postData ?? []) as Post[];
      setPosts(loadedPosts);

      const { data: likes, error: likesError } = await supabase
        .from("post_likes")
        .select("post_id");

      if (likesError) {
        console.error("좋아요 불러오기 오류:", likesError);
      }

      const newLikeCountMap = new Map<number, number>();

      likes?.forEach((like) => {
        newLikeCountMap.set(
          like.post_id,
          (newLikeCountMap.get(like.post_id) ?? 0) + 1
        );
      });

      setLikeCountMap(newLikeCountMap);

      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("post_id");

      if (commentsError) {
        console.error("댓글 불러오기 오류:", commentsError);
      }

      const newCommentCountMap = new Map<number, number>();

      comments?.forEach((comment) => {
        newCommentCountMap.set(
          comment.post_id,
          (newCommentCountMap.get(comment.post_id) ?? 0) + 1
        );
      });

      setCommentCountMap(newCommentCountMap);

      const userIds = [
        ...new Set(
          loadedPosts
            .map((post) => post.user_id)
            .filter((userId) => userId)
        ),
      ];

      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, nickname")
          .in("id", userIds);

        if (profileError) {
          console.error("프로필 불러오기 오류:", profileError);
        }

        const newNicknameMap = new Map(
          ((profiles ?? []) as Profile[]).map((profile) => [
            profile.id,
            profile.nickname,
          ])
        );

        setNicknameMap(newNicknameMap);
      }

      setLoading(false);
    }

    fetchHomeData();
  }, []);

  const filteredPosts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    const searchedPosts = posts.filter((post) => {
      if (!keyword) {
        return true;
      }

      const title = post.title?.toLowerCase() ?? "";
      const content = post.content?.toLowerCase() ?? "";

      return title.includes(keyword) || content.includes(keyword);
    });

    return [...searchedPosts].sort((a, b) => {
      if (sortType === "popular") {
        const aLikes = likeCountMap.get(a.id) ?? 0;
        const bLikes = likeCountMap.get(b.id) ?? 0;

        return bLikes - aLikes;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [posts, searchKeyword, sortType, likeCountMap]);

  return (    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">예진이네 농장</h1>
          <AuthButton />
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="제목 또는 내용을 검색하세요"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSortType("latest")}
            className={`flex-1 rounded-xl py-2 ${
              sortType === "latest"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            최신순
          </button>

          <button
            type="button"
            onClick={() => setSortType("popular")}
            className={`flex-1 rounded-xl py-2 ${
              sortType === "popular"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600"
            }`}
          >
            인기순
          </button>
        </div>

        <Link
          href="/write"
          className="mb-6 block w-full rounded-xl bg-blue-500 py-3 text-center text-white"
        >
          ✏️ 글쓰기
        </Link>

        {loading && (
          <p className="py-10 text-center text-gray-500">
            게시글 불러오는 중...
          </p>
        )}

        {!loading && filteredPosts.length === 0 && (
          <p className="rounded-xl bg-white py-10 text-center text-gray-500">
            검색 결과가 없습니다.
          </p>
        )}

        <div className="space-y-3 pb-20">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block rounded-lg border bg-white p-4 hover:bg-gray-50"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {nicknameMap.get(post.user_id) ?? "익명"}
                </p>

                <p className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleString("ko-KR")}
                </p>
              </div>

              <h2 className="text-lg font-bold">{post.title}</h2>

              <p className="mt-2 line-clamp-2 text-gray-600">
                {post.content}
              </p>

              <div className="mt-3 flex justify-end gap-4 text-sm text-gray-500">
                <span>❤️ {likeCountMap.get(post.id) ?? 0}</span>
                <span>💬 {commentCountMap.get(post.id) ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-white p-4">
          <span>🏠 홈</span>
          <span>💬 채팅</span>
          <Link href="/mypage">👤 내정보</Link>
        </div>
      </div>
    </main>
  );
}