"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LikeButtonProps = {
  postId: number;
};

export default function LikeButton({
  postId,
}: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadLikeData() {
      const { count } = await supabase
        .from("post_likes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("post_id", postId);

      setLikeCount(count ?? 0);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: myLike } = await supabase
          .from("post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();

        setLiked(Boolean(myLike));
      }

      setLoading(false);
    }

    loadLikeData();
  }, [postId]);

  async function handleLike() {
    if (processing) {
      return;
    }

    setProcessing(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("좋아요를 누르려면 로그인해야 합니다.");
      setProcessing(false);
      return;
    }

    if (liked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        console.error("좋아요 취소 오류:", error);
        alert("좋아요 취소에 실패했습니다.");
        setProcessing(false);
        return;
      }

      setLiked(false);
      setLikeCount((count) => Math.max(0, count - 1));
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        console.error("좋아요 등록 오류:", error);
        alert("좋아요 등록에 실패했습니다.");
        setProcessing(false);
        return;
      }

      setLiked(true);
      setLikeCount((count) => count + 1);
    }

    setProcessing(false);
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-400"
      >
        좋아요 불러오는 중...
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={processing}
      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
        liked
          ? "border-red-500 bg-red-50 text-red-500"
          : "border-gray-300 bg-white text-gray-600"
      } disabled:opacity-50`}
    >
      {liked ? "♥" : "♡"} 좋아요 {likeCount}
    </button>
  );
}