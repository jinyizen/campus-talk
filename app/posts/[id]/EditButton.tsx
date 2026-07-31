"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type EditButtonProps = {
  postId: number;
  authorId: string | null;
};

export default function EditButton({
  postId,
  authorId,
}: EditButtonProps) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsOwner(!!user && user.id === authorId);
    }

    checkOwner();
  }, [authorId]);

  if (!isOwner) {
    return null;
  }

  return (
    <Link
      href={`/posts/${postId}/edit`}
      className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
    >
      수정
    </Link>
  );
}