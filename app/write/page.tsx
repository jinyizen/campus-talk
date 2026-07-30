"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function handleSubmit() {
    const { error } = await supabase
      .from("posts")
      .insert({
        title: title,
        content: content,
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
      <div className="max-w-md mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          ✏️ 글쓰기
        </h1>

        <div className="bg-white rounded-xl p-4 shadow">

          <input
            className="w-full border p-3 rounded-lg mb-4"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full border p-3 rounded-lg h-40"
            placeholder="무슨 일이 있었나요?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-500 text-white py-3 rounded-xl mt-4"
          >
            작성하기
          </button>

        </div>

      </div>
    </main>
  );
}