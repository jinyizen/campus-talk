"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import AuthButton from "./components/AuthButton";

type Category = "자유" | "정보" | "질문" | "비밀";
type SelectedCategory = "전체" | Category;
type SortType = "latest" | "popular";

type Post = {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  category: Category;
};

type Profile = {
  id: string;
  nickname: string;
};

type PostRelation = {
  post_id: number;
};

const categories: SelectedCategory[] = [
  "전체",
  "자유",
  "정보",
  "질문",
  "비밀",
];

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
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
  const [sortType, setSortType] = useState<SortType>("latest");

  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("전체");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchHomeData() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("세션 조회 오류:", sessionError);
        }

        if (isMounted) {
          setUser(session?.user ?? null);
        }

        const [
          { data: postData, error: postError },
          { data: likes, error: likesError },
          { data: comments, error: commentsError },
        ] = await Promise.all([
          supabase
            .from("posts")
            .select("id, title, content, user_id, created_at, category")
            .order("created_at", { ascending: false }),

          supabase.from("post_likes").select("post_id"),

          supabase.from("comments").select("post_id"),
        ]);

        if (postError) {
          throw postError;
        }

        if (likesError) {
          console.error("좋아요 불러오기 오류:", likesError);
        }

        if (commentsError) {
          console.error("댓글 불러오기 오류:", commentsError);
        }

        const loadedPosts = (postData ?? []) as Post[];
        const loadedLikes = (likes ?? []) as PostRelation[];
        const loadedComments = (comments ?? []) as PostRelation[];

        const newLikeCountMap = createCountMap(loadedLikes);
        const newCommentCountMap = createCountMap(loadedComments);

        const userIds = [
          ...new Set(
            loadedPosts
              .map((post) => post.user_id)
              .filter((userId): userId is string => Boolean(userId))
          ),
        ];

        const newNicknameMap = new Map<string, string>();

        if (userIds.length > 0) {
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("id, nickname")
            .in("id", userIds);

          if (profileError) {
            console.error("프로필 불러오기 오류:", profileError);
          } else {
            ((profiles ?? []) as Profile[]).forEach((profile) => {
              newNicknameMap.set(profile.id, profile.nickname);
            });
          }
        }

        if (!isMounted) {
          return;
        }

        setPosts(loadedPosts);
        setLikeCountMap(newLikeCountMap);
        setCommentCountMap(newCommentCountMap);
        setNicknameMap(newNicknameMap);
      } catch (error) {
        console.error("메인 페이지 조회 오류:", error);

        if (isMounted) {
          setErrorMessage("게시글을 불러오지 못했습니다.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchHomeData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function createCountMap(items: PostRelation[]) {
    const countMap = new Map<number, number>();

    items.forEach((item) => {
      countMap.set(
        item.post_id,
        (countMap.get(item.post_id) ?? 0) + 1
      );
    });

    return countMap;
  }

  function moveToLogin(message: string) {
    const shouldMove = window.confirm(message);

    if (shouldMove) {
      router.push("/login");
    }
  }

  function handleWriteClick() {
    if (!user) {
      moveToLogin("글을 작성하려면 로그인이 필요합니다. 로그인할까요?");
      return;
    }

    router.push("/write");
  }

  function handleMyPageClick() {
    if (!user) {
      moveToLogin("내정보를 확인하려면 로그인이 필요합니다. 로그인할까요?");
      return;
    }

    router.push("/mypage");
  }

  function handleResetFilter() {
    setSearchKeyword("");
    setSelectedCategory("전체");
    setSortType("latest");
  }

  const filteredPosts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    const searchedPosts = posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "전체" ||
        post.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

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

        if (aLikes !== bLikes) {
          return bLikes - aLikes;
        }
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    posts,
    searchKeyword,
    sortType,
    selectedCategory,
    likeCountMap,
  ]);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-md pb-20">
        <header className="mb-8 flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-3xl font-bold">
            예진이네 농장
          </h1>

          <div className="shrink-0">
            <AuthButton />
          </div>
        </header>

        <div className="relative mb-4">
          <input
            type="search"
            placeholder="제목 또는 내용을 검색하세요"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 outline-none focus:border-blue-500"
          />

          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-700"
              aria-label="검색어 지우기"
            >
              ✕
            </button>
          )}
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSortType("latest")}
            className={`flex-1 rounded-xl py-2 font-medium ${
              sortType === "latest"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            최신순
          </button>

          <button
            type="button"
            onClick={() => setSortType("popular")}
            className={`flex-1 rounded-xl py-2 font-medium ${
              sortType === "popular"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            인기순
          </button>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleWriteClick}
          className="mb-6 block w-full rounded-xl bg-blue-500 py-3 text-center font-medium text-white hover:bg-blue-600"
        >
          ✏️ 글쓰기
        </button>

        {loading && (
          <div className="rounded-xl bg-white py-10 text-center text-gray-500">
            게시글 불러오는 중...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-xl bg-white px-5 py-10 text-center">
            <p className="text-gray-500">{errorMessage}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!loading &&
          !errorMessage &&
          filteredPosts.length === 0 && (
            <div className="rounded-xl bg-white px-5 py-10 text-center">
              <p className="text-gray-500">
                {posts.length === 0
                  ? "아직 작성된 게시글이 없습니다."
                  : "검색 조건에 맞는 게시글이 없습니다."}
              </p>

              {posts.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  검색 조건 초기화
                </button>
              )}
            </div>
          )}

        {!loading && !errorMessage && (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:bg-gray-50"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {post.category ?? "자유"}
                    </span>

                    <p className="truncate text-sm font-semibold text-gray-700">
                      {post.category === "비밀"
                        ? "익명"
                        : nicknameMap.get(post.user_id) ?? "익명"}
                    </p>
                  </div>

                  <time className="shrink-0 text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString(
                      "ko-KR",
                      {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </time>
                </div>

                <h2 className="truncate text-lg font-bold">
                  {post.title}
                </h2>

                <p className="mt-2 line-clamp-2 break-words text-gray-600">
                  {post.content}
                </p>

                <div className="mt-3 flex justify-end gap-4 text-sm text-gray-500">
                  <span>❤️ {likeCountMap.get(post.id) ?? 0}</span>
                  <span>💬 {commentCountMap.get(post.id) ?? 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-md items-center justify-around px-4 py-4">
          <Link href="/" className="font-semibold text-blue-500">
            🏠 홈
          </Link>

          <span className="cursor-not-allowed text-gray-400">
            💬 채팅
          </span>

          <button
            type="button"
            onClick={handleMyPageClick}
            className="text-gray-700"
          >
            👤 내정보
          </button>
        </div>
      </nav>
    </main>
  );
}