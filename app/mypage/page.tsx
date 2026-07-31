"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Post = {
  id: number;
  title: string;
  created_at: string;
};

type Comment = {
  id: number;
  content: string;
  created_at: string;
  post_id: number;
  post_title: string;
};

type RawComment = {
  id: number;
  content: string;
  created_at: string;
  post_id: number;
};

export default function MyPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchMyPage() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("세션 조회 오류:", sessionError);
          return;
        }

        const user = session?.user;

        if (!user) {
          return;
        }

        if (isMounted) {
          setUserId(user.id);
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("프로필 조회 오류:", profileError);
        }

        const currentNickname = profile?.nickname ?? "사용자";

        if (isMounted) {
          setNickname(currentNickname);
          setNicknameInput(currentNickname);
        }

        const { data: myPosts, error: postsError } = await supabase
          .from("posts")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("게시글 조회 오류:", postsError);
        }

        if (isMounted) {
          setPosts((myPosts ?? []) as Post[]);
        }

        const { data: myComments, error: commentsError } = await supabase
          .from("comments")
          .select("id, content, created_at, post_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (commentsError) {
          console.error("댓글 조회 오류:", commentsError);
          return;
        }

        const rawComments = (myComments ?? []) as RawComment[];

        if (rawComments.length === 0) {
          if (isMounted) {
            setComments([]);
          }

          return;
        }

        const postIds = [
          ...new Set(rawComments.map((comment) => comment.post_id)),
        ];

        const { data: relatedPosts, error: relatedPostsError } = await supabase
          .from("posts")
          .select("id, title")
          .in("id", postIds);

        if (relatedPostsError) {
          console.error("댓글 게시글 조회 오류:", relatedPostsError);
        }

        const titleMap = new Map<number, string>();

        (relatedPosts ?? []).forEach((post) => {
          titleMap.set(post.id, post.title);
        });

        const commentsWithTitles: Comment[] = rawComments.map((comment) => ({
          ...comment,
          post_title: titleMap.get(comment.post_id) ?? "삭제된 게시물",
        }));

        if (isMounted) {
          setComments(commentsWithTitles);
        }
      } catch (error) {
        console.error("마이페이지 전체 오류:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMyPage();

    const loadingTimer = window.setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimer);
    };
  }, []);

  async function handleSaveNickname() {
    const trimmedNickname = nicknameInput.trim();

    if (!userId) {
      alert("로그인 정보를 확인할 수 없습니다.");
      return;
    }

    if (!trimmedNickname) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    if (trimmedNickname.length < 2) {
      alert("닉네임은 2자 이상 입력해주세요.");
      return;
    }

    if (trimmedNickname.length > 12) {
      alert("닉네임은 12자 이하로 입력해주세요.");
      return;
    }

    if (trimmedNickname === nickname) {
      setIsEditingNickname(false);
      return;
    }

    setIsSavingNickname(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: trimmedNickname,
        })
        .eq("id", userId);

      if (error) {
        console.error("닉네임 수정 오류:", error);

        if (error.code === "23505") {
          alert("이미 사용 중인 닉네임입니다.");
          return;
        }

        alert("닉네임 수정에 실패했습니다.");
        return;
      }

      setNickname(trimmedNickname);
      setNicknameInput(trimmedNickname);
      setIsEditingNickname(false);

      alert("닉네임이 변경되었습니다.");
    } catch (error) {
      console.error("닉네임 수정 전체 오류:", error);
      alert("닉네임 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSavingNickname(false);
    }
  }

  function handleCancelNicknameEdit() {
    setNicknameInput(nickname);
    setIsEditingNickname(false);
  }

  async function handleLogout() {
    const shouldLogout = window.confirm("로그아웃하시겠습니까?");

    if (!shouldLogout) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("로그아웃 오류:", error);
        alert("로그아웃에 실패했습니다.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("로그아웃 전체 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        불러오는 중...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="mb-4 inline-block text-blue-500 hover:underline"
        >
          ← 목록으로
        </Link>

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
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">닉네임</p>

                  {isEditingNickname ? (
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(event) =>
                        setNicknameInput(event.target.value)
                      }
                      maxLength={12}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                      placeholder="닉네임을 입력해주세요"
                    />
                  ) : (
                    <p className="mt-1 truncate text-2xl font-bold">
                      {nickname}
                    </p>
                  )}
                </div>

                {!isEditingNickname && (
                  <button
                    type="button"
                    onClick={() => setIsEditingNickname(true)}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    수정
                  </button>
                )}
              </div>

              {isEditingNickname && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNickname}
                    disabled={isSavingNickname}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isSavingNickname ? "저장 중..." : "저장"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelNicknameEdit}
                    disabled={isSavingNickname}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed"
                  >
                    취소
                  </button>
                </div>
              )}

              <div className="mt-4 flex gap-5">
                <span>📝 글 {posts.length}</span>
                <span>💬 댓글 {comments.length}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="mt-5 w-full rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
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

            <h2 className="mb-3 mt-8 text-xl font-bold">내가 쓴 댓글</h2>

            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="rounded-xl bg-white p-5 text-center text-gray-500">
                  작성한 댓글이 없습니다.
                </div>
              ) : (
                comments.map((comment) => (
                  <Link
                    key={comment.id}
                    href={`/posts/${comment.post_id}`}
                    className="block rounded-xl bg-white p-4 hover:bg-gray-50"
                  >
                    <p className="mb-2 text-xs font-medium text-blue-500">
                      게시물: {comment.post_title}
                    </p>

                    <p className="line-clamp-2 text-sm">{comment.content}</p>

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleString("ko-KR")}
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