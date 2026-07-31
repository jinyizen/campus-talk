"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleSubmit() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const { error } = await supabase.from("posts").insert({
  title: title,
  content: content,
  user_id: user.id,
});

    if (error) {
      alert("저장 실패!");
      console.log(error);
      return;
    }

    alert("글 작성 완료!");
    setTitle("");
    setContent("");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-8 text-3xl font-bold">✏️ 글쓰기</h1>

        <div className="rounded-xl bg-white p-4 shadow">
          <input
            className="mb-4 w-full rounded-lg border p-3"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="h-40 w-full rounded-lg border p-3"
            placeholder="무슨 일이 있었나요?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            className="mt-4 w-full rounded-xl bg-blue-500 py-3 text-white"
          >
            작성하기
          </button>
        </div>
      </div>
    </main>
  );
}