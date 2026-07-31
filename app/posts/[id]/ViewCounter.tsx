"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ViewCounterProps = {
  postId: number;
  initialViewCount: number;
};

export default function ViewCounter({
  postId,
  initialViewCount,
}: ViewCounterProps) {
  const [viewCount, setViewCount] =
    useState(initialViewCount);

  useEffect(() => {
    let isMounted = true;

    async function increaseViewCount() {
      const storageKey = `viewed-post-${postId}`;

      try {
        const alreadyViewed =
          sessionStorage.getItem(storageKey);

        if (alreadyViewed) {
          return;
        }

        const { error } = await supabase.rpc(
          "increment_post_view",
          {
            target_post_id: postId,
          }
        );

        if (error) {
          console.error("조회수 증가 오류:", error);
          return;
        }

        sessionStorage.setItem(storageKey, "true");

        if (isMounted) {
          setViewCount(
            (currentViewCount) =>
              currentViewCount + 1
          );
        }
      } catch (error) {
        console.error(
          "조회수 처리 전체 오류:",
          error
        );
      }
    }

    increaseViewCount();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  return (
    <span className="text-xs text-gray-400 sm:text-sm">
      조회 {viewCount}
    </span>
  );
}