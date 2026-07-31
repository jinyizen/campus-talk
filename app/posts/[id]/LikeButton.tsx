"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type LikeButtonProps = {
  postId: number;
};

export default function LikeButton({
  postId,
}: LikeButtonProps) {
  const router = useRouter();

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLikeData() {
      try {
        const { count, error: countError } = await supabase
          .from("post_likes")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("post_id", postId);

        if (countError) {
          console.error(
            "좋아요 개수 조회 오류:",
            countError
          );
        }

        if (isMounted) {
          setLikeCount(count ?? 0);
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error(
            "로그인 정보 조회 오류:",
            sessionError
          );
        }

        const user = session?.user;

        if (!user) {
          if (isMounted) {
            setLiked(false);
          }

          return;
        }

        const { data: myLike, error: myLikeError } =
          await supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (myLikeError) {
          console.error(
            "내 좋아요 조회 오류:",
            myLikeError
          );
        }

        if (isMounted) {
          setLiked(Boolean(myLike));
        }
      } catch (error) {
        console.error(
          "좋아요 정보 전체 조회 오류:",
          error
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLikeData();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  async function handleLike() {
    if (processing) {
      return;
    }

    setProcessing(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error(
          "로그인 정보 조회 오류:",
          sessionError
        );

        alert("로그인 정보를 확인하지 못했습니다.");
        return;
      }

      const user = session?.user;

      if (!user) {
        const shouldLogin = window.confirm(
          "좋아요를 누르려면 로그인이 필요합니다.\n로그인 페이지로 이동할까요?"
        );

        if (shouldLogin) {
          router.push("/login");
        }

        return;
      }

      if (liked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) {
          console.error(
            "좋아요 취소 오류:",
            error
          );

          alert("좋아요 취소에 실패했습니다.");
          return;
        }

        setLiked(false);
        setLikeCount((currentCount) =>
          Math.max(0, currentCount - 1)
        );
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user.id,
          });

        if (error) {
          console.error(
            "좋아요 등록 오류:",
            error
          );

          if (error.code === "23505") {
            setLiked(true);
            alert("이미 좋아요한 게시글입니다.");
            return;
          }

          alert("좋아요 등록에 실패했습니다.");
          return;
        }

        setLiked(true);
        setLikeCount(
          (currentCount) => currentCount + 1
        );
      }
    } catch (error) {
      console.error(
        "좋아요 처리 전체 오류:",
        error
      );

      alert("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
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
      aria-pressed={liked}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        liked
          ? "border-red-500 bg-red-50 text-red-500 hover:bg-red-100"
          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {processing
        ? "처리 중..."
        : `${liked ? "♥" : "♡"} 좋아요 ${likeCount}`}
    </button>
  );
}