"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type CommentDeleteButtonProps = {
  commentId: number;
  authorId: string | null;
};

export default function CommentDeleteButton({
  commentId,
  authorId,
}: CommentDeleteButtonProps) {
  const router = useRouter();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!currentUserId) {
      return;
    }

    const confirmed = window.confirm("댓글을 삭제하시겠습니까?");

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("댓글 삭제 오류:", error);
      alert("댓글 삭제에 실패했습니다.");
      setDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:text-gray-400"
    >
      {deleting ? "삭제 중..." : "삭제"}
    </button>
  );
}