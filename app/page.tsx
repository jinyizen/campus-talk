import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthButton from "./components/AuthButton";

export default async function Home() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("게시글 불러오기 오류:", error);
  }

  const userIds = [
    ...new Set(
      (posts ?? [])
        .map((post) => post.user_id)
        .filter((userId) => userId)
    ),
  ];

  let profiles: { id: string; nickname: string }[] = [];

  if (userIds.length > 0) {
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", userIds);

    if (profileError) {
      console.error("프로필 불러오기 오류:", profileError);
    }

    profiles = data ?? [];
  }

  const nicknameMap = new Map(
    profiles.map((profile) => [profile.id, profile.nickname])
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">예진이네 농장</h1>

          <AuthButton />
        </div>

        <Link
          href="/write"
          className="mb-6 block w-full rounded-xl bg-blue-500 py-3 text-center text-white"
        >
          ✏️ 글쓰기
        </Link>

        <div className="space-y-3 pb-20">
          {posts?.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.id}`}
              className="block rounded-lg border bg-white p-4 hover:bg-gray-50"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {nicknameMap.get(post.user_id) ?? "익명"}
                </p>

                <p className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleString("ko-KR")}
                </p>
              </div>

              <h2 className="text-lg font-bold">{post.title}</h2>

              <p className="mt-2 line-clamp-2 text-gray-600">
                {post.content}
              </p>
            </Link>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 flex justify-around border-t bg-white p-4">
          <span>🏠 홈</span>
          <span>💬 채팅</span>
          <span>👤 내정보</span>
        </div>
      </div>
    </main>
  );
}