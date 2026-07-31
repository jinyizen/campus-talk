"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CommentEditButtonProps = {
  commentId: number;
  authorId: string | null;
  initialContent: string;
};

export default function CommentEditButton({
  commentId,
  authorId,
  initialContent,
}: CommentEditButtonProps) {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("사용자 확인 오류:", error);
      }

      setCurrentUserId(user?.id ?? null);
      setAuthChecked(true);
    }

    checkUser();
  }, []);

  if (!authChecked || !authorId || currentUserId !== authorId) {
    return null;
  }

  function handleCancel() {
    setContent(initialContent);
    setIsEditing(false);
  }

  async function handleSave() {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (!currentUserId) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("comments")
      .update({
        content: trimmedContent,
      })
      .eq("id", commentId)
      .eq("user_id", currentUserId);

    setSaving(false);

    if (error) {
      console.error("댓글 수정 오류:", error);
      alert("댓글 수정에 실패했습니다.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  if (isEditing) {
    return (
      <div className="mt-3 w-full">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-blue-500"
        />

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="text-xs font-medium text-blue-500 hover:underline"
    >
      수정
    </button>
  );
}