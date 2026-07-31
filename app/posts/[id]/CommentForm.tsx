"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CommentForm({
  postId,
}: {
  postId: number;
}) {
  const [content, setContent] = useState("");

  async function handleSubmit() {
    if (!content.trim()) return;

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      content,
    });

    if (error) {
      alert("댓글 작성 실패");
      return;
    }

    alert("댓글이 등록되었습니다!");
    location.reload();
  }

  return (
    <div className="mt-8">
      <textarea
        className="w-full rounded-lg border p-3"
        rows={4}
        placeholder="댓글을 입력하세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-white"
      >
        댓글 등록
      </button>
    </div>
  );
}