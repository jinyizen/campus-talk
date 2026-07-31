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
        </article>
      </div>
    </main>
  );
}