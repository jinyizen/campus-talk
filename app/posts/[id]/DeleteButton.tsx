"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DeleteButtonProps = {
  postId: number;
  authorId: string | null;
};

export default function DeleteButton({
  postId,
  authorId,
}: DeleteButtonProps) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsOwner(!!user && user.id === authorId);
    }

    checkOwner();
  }, [authorId]);

  async function handleDelete() {
    const confirmed = window.confirm("정말 삭제할까?");

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", authorId);

    if (error) {
      alert("게시글 삭제에 실패했습니다.");
      console.error(error);
      setDeleting(false);
      return;
    }

    alert("게시글이 삭제되었습니다.");
    router.push("/");
    router.refresh();
  }

  if (!isOwner) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white disabled:opacity-50"
    >
      {deleting ? "삭제 중..." : "삭제"}
    </button>
  );
}