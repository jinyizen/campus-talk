"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WritePage() {
  const router = useRouter();

  const [category, setCategory] = useState("자유");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("posts").insert({
      title: title.trim(),
      content: content.trim(),
      category,
      user_id: user.id,
    });

    setSubmitting(false);

    if (error) {
      alert("저장 실패!");
      console.error(error);
      return;
    }

    alert("글 작성 완료!");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
  <h1 className="text-3xl font-bold">✏️ 글쓰기</h1>

  <Link
    href="/"
    className="rounded-lg bg-white px-4 py-2 text-sm text-gray-700 shadow"
  >
    ← 목록으로
  </Link>
</div>

        <div className="rounded-xl bg-white p-4 shadow">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            카테고리
          </label>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mb-4 w-full rounded-lg border bg-white p-3"
          >
            <option value="자유">자유</option>
            <option value="12시">12시</option>
            <option value="3시">3시</option>
            <option value="6시">6시</option>
          </select>

          <input
            className="mb-4 w-full rounded-lg border p-3"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <textarea
            className="h-40 w-full resize-none rounded-lg border p-3"
            placeholder="무슨 일이 있었나요?"
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-blue-500 py-3 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting ? "작성 중..." : "작성하기"}
          </button>
        </div>
      </div>
    </main>
  );
}