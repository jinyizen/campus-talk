import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

if (error) {
  console.error("Supabase 오류:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          예진이네 농장
        </h1>

        <Link href="/write">
          <button className="w-full bg-blue-500 text-white py-3 rounded-xl mb-6">
            ✏️ 글쓰기
          </button>
        </Link>

        {posts?.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`}>
            <div className="bg-white rounded-xl p-4 shadow mb-4 cursor-pointer">
              <h2 className="font-bold text-lg">{post.title}</h2>

              <p className="text-gray-500 mt-2">{post.content}</p>

              <p className="mt-3">💬 댓글 0개</p>
            </div>
          </Link>
        ))}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around">
          <span>🏠 홈</span>
          <span>💬 채팅</span>
          <span>👤 내정보</span>
        </div>
      </div>
    </main>
  );
}