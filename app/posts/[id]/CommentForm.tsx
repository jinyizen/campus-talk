"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CommentForm({
  postId,
}: {
  postId: number;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedContent = content.trim();

    if (!trimmedContent || submitting) {
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("댓글을 작성하려면 로그인해야 합니다.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      content: trimmedContent,
      user_id: user.id,
    });

    if (error) {
      console.error("댓글 작성 오류:", error);
      alert("댓글 작성에 실패했습니다.");
      setSubmitting(false);
      return;
    }

    setContent("");
    location.reload();
  }

  return (
    <div className="mt-8">
      <textarea
        className="w-full rounded-lg border p-3"
        rows={4}
        placeholder="댓글을 입력하세요."
        value={content}
        onChange={(event) => setContent(event.target.value)}
        disabled={submitting}
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !content.trim()}
        className="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "등록 중..." : "댓글 등록"}
      </button>
    </div>
  );
}