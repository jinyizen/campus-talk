import CommentForm from "./CommentForm";
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

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error || !post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-blue-500 hover:underline">
          ← 목록으로
        </Link>

        <article className="mt-4 rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold">{post.title}</h1>

          <p className="mt-2 text-sm text-gray-400">
            {new Date(post.created_at).toLocaleString("ko-KR")}
          </p>

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
                    <p className="whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleString("ko-KR")}
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