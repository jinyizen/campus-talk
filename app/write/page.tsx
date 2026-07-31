"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Category = "자유" | "질문" | "정보" | "비밀";

export default function WritePage() {
  const router = useRouter();

  const [category, setCategory] = useState<Category>("자유");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkLogin() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("로그인 확인 오류:", error);
        }

        if (!session?.user) {
          alert("글을 작성하려면 로그인이 필요합니다.");
          router.replace("/login");
          return;
        }
      } catch (error) {
        console.error("로그인 확인 전체 오류:", error);
        alert("로그인 정보를 확인하지 못했습니다.");
        router.replace("/login");
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkLogin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit() {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (submitting) {
      return;
    }

    if (!trimmedTitle) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (trimmedTitle.length > 100) {
      alert("제목은 100자 이하로 입력해주세요.");
      return;
    }

    if (!trimmedContent) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (trimmedContent.length > 5000) {
      alert("내용은 5000자 이하로 입력해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("세션 조회 오류:", sessionError);
        alert("로그인 정보를 확인하지 못했습니다.");
        return;
      }

      const user = session?.user;

      if (!user) {
        alert("로그인이 필요합니다.");
        router.replace("/login");
        return;
      }

      const { data: createdPost, error } = await supabase
        .from("posts")
        .insert({
          title: trimmedTitle,
          content: trimmedContent,
          category,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (error) {
        console.error("게시글 저장 오류:", error);
        alert("게시글 저장에 실패했습니다.");
        return;
      }

      alert("글 작성이 완료되었습니다.");

      router.replace(`/posts/${createdPost.id}`);
      router.refresh();
    } catch (error) {
      console.error("게시글 작성 전체 오류:", error);
      alert("게시글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">로그인 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-md">
        <header className="mb-8 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">✏️ 글쓰기</h1>

          <Link
            href="/"
            className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ← 목록으로
          </Link>
        </header>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            카테고리
          </label>

          <select
            id="category"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as Category)
            }
            disabled={submitting}
            className="mb-5 w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="자유">자유</option>
            <option value="질문">질문</option>
            <option value="정보">정보</option>
            <option value="비밀">비밀</option>
          </select>

          <label
            htmlFor="title"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            제목
          </label>

          <input
            id="title"
            type="text"
            maxLength={100}
            className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={submitting}
          />

          <p className="mb-5 mt-1 text-right text-xs text-gray-400">
            {title.length}/100
          </p>

          <label
            htmlFor="content"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            내용
          </label>

          <textarea
            id="content"
            maxLength={5000}
            className="h-48 w-full resize-none rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
            placeholder="무슨 일이 있었나요?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            disabled={submitting}
          />

          <p className="mt-1 text-right text-xs text-gray-400">
            {content.length}/5000
          </p>

          {category === "비밀" && (
            <div className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">
              비밀 카테고리에서는 작성자 닉네임이 익명으로 표시됩니다.
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              submitting ||
              !title.trim() ||
              !content.trim()
            }
            className="mt-5 w-full rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting ? "작성 중..." : "작성하기"}
          </button>
        </div>
      </div>
    </main>
  );
}