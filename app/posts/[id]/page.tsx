import EditButton from "./EditButton";
import CommentForm from "./CommentForm";
import DeleteButton from "./DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostPage({
  params,
}: PostPageProps) {
  const { id } = await params;

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    notFound();
  }

  let nickname = "익명";

  if (post.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", post.user_id)
      .single();

    if (profile?.nickname) {
      nickname = profile.nickname;
    }
  }

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("댓글 불러오기 오류:", commentsError);
  }

  const commentUserIds = [
    ...new Set(
      comments
        ?.map((comment) => comment.user_id)
        .filter((userId): userId is string => Boolean(userId)) ?? []
    ),
  ];

  const commentNicknameMap = new Map<string, string>();

  if (commentUserIds.length > 0) {
    const { data: commentProfiles } = await supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", commentUserIds);

    commentProfiles?.forEach((profile) => {
      commentNicknameMap.set(profile.id, profile.nickname);
    });
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-blue-500 hover:underline">
          ← 목록으로
        </Link>

        <article className="mt-4 rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">{post.title}</h1>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {nickname}
            </p>

            <p className="text-sm text-gray-400">
              {new Date(post.created_at).toLocaleString("ko-KR")}
            </p>
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

          <hr className="my-4" />

          <p className="whitespace-pre-wrap">{post.content}</p>

          <div className="mt-8">
            <h2 className="text-lg font-bold">댓글</h2>

            <div className="mt-4 space-y-3">
              {comments && comments.length > 0 ? (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        {comment.user_id
                          ? commentNicknameMap.get(comment.user_id) ?? "익명"
                          : "익명"}
                      </p>

                      <p className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleString("ko-KR")}
                      </p>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">
                  아직 댓글이 없습니다.
                </p>
              )}
            </div>
          </div>

          <CommentForm postId={post.id} />
        </article>
      </div>
    </main>
  );
}