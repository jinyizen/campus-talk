import EditButton from "./EditButton";
import CommentForm from "./CommentForm";
import DeleteButton from "./DeleteButton";
import CommentDeleteButton from "./CommentDeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LikeButton from "./LikeButton";
import ViewCounter from "./ViewCounter";

type PostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostPage({
  params,
}: PostPageProps) {
  const { id } = await params;

  const { data: post, error: postError } = await supabase
  .from("posts")
  .select(
    "id, title, content, category, user_id, created_at, view_count"
  )
  .eq("id", id)
  .single();

  if (postError || !post) {
    notFound();
  }
  console.log(post.created_at);
console.log(typeof post.created_at);

  const isSecretPost = post.category === "비밀";

  let nickname = "익명";

  if (!isSecretPost && post.user_id) {
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", post.user_id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "게시글 작성자 조회 오류:",
        profileError
      );
    }

    if (profile?.nickname) {
      nickname = profile.nickname;
    }
  }

  const { data: comments, error: commentsError } =
    await supabase
      .from("comments")
      .select(
        "id, content, user_id, post_id, created_at"
      )
      .eq("post_id", id)
      .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("댓글 불러오기 오류:", commentsError);
  }

  const loadedComments = comments ?? [];

  const commentUserIds = [
    ...new Set(
      loadedComments
        .map((comment) => comment.user_id)
        .filter(
          (userId): userId is string => Boolean(userId)
        )
    ),
  ];

  const commentNicknameMap = new Map<string, string>();

  if (!isSecretPost && commentUserIds.length > 0) {
    const {
      data: commentProfiles,
      error: commentProfilesError,
    } = await supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", commentUserIds);

    if (commentProfilesError) {
      console.error(
        "댓글 작성자 조회 오류:",
        commentProfilesError
      );
    }

    commentProfiles?.forEach((profile) => {
      commentNicknameMap.set(
        profile.id,
        profile.nickname
      );
    });
  }

  const anonymousNumberMap = new Map<string, number>();
  let nextAnonymousNumber = 1;

  loadedComments.forEach((comment) => {
    if (!comment.user_id) {
      return;
    }

    if (comment.user_id === post.user_id) {
      return;
    }

    if (!anonymousNumberMap.has(comment.user_id)) {
      anonymousNumberMap.set(
        comment.user_id,
        nextAnonymousNumber
      );

      nextAnonymousNumber += 1;
    }
  });

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-block text-blue-500 hover:underline"
        >
          ← 목록으로
        </Link>

        <article className="mt-4 rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
              {post.category ?? "자유"}
            </span>

            {isSecretPost && (
              <span className="text-xs text-gray-400">
                익명 게시글
              </span>
            )}
          </div>

          <h1 className="break-words text-2xl font-bold">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-700">
              {isSecretPost ? "익명" : nickname}
            </p>

            <div className="flex items-center gap-3">
  <ViewCounter
    postId={post.id}
    initialViewCount={post.view_count ?? 0}
  />

  <time className="text-xs text-gray-400 sm:text-sm">
    {new Date(post.created_at).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })}
  </time>
</div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <EditButton
              postId={post.id}
              authorId={post.user_id}
            />

            <DeleteButton
              postId={post.id}
              authorId={post.user_id}
            />
          </div>

          <hr className="my-5" />

          <p className="min-h-24 whitespace-pre-wrap break-words leading-7">
            {post.content}
          </p>

          <div className="mt-6">
            <LikeButton postId={post.id} />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold">
              댓글 {loadedComments.length}
            </h2>

            <div className="mt-4 space-y-3">
              {loadedComments.length > 0 ? (
                loadedComments.map((comment) => {
                  let commentNickname = "익명";

                  if (isSecretPost) {
                    if (
                      comment.user_id === post.user_id
                    ) {
                      commentNickname = "글쓴이";
                    } else if (comment.user_id) {
                      const anonymousNumber =
                        anonymousNumberMap.get(
                          comment.user_id
                        );

                      commentNickname = anonymousNumber
                        ? `익명${anonymousNumber}`
                        : "익명";
                    }
                  } else if (comment.user_id) {
                    commentNickname =
                      commentNicknameMap.get(
                        comment.user_id
                      ) ?? "익명";
                  }

                  return (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-700">
                            {commentNickname}
                          </p>

                          <p className="mt-2 whitespace-pre-wrap break-words">
                            {comment.content}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <time className="text-xs text-gray-400">
  {new Date(comment.created_at).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}
</time>

                          <CommentDeleteButton
                            commentId={comment.id}
                            authorId={comment.user_id}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
                  <p className="text-sm text-gray-400">
                    아직 댓글이 없습니다.
                  </p>
                </div>
              )}
            </div>
          </section>

          <CommentForm postId={post.id} />
        </article>
      </div>
    </main>
  );
}