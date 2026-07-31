"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const postId = params.id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPost() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const { data: post, error } = await supabase
        .from("posts")
        .select("id, title, content, user_id")
        .eq("id", postId)
        .single();

      if (error || !post) {
        alert("게시글을 불러오지 못했습니다.");
        router.push("/");
        return;
      }

      if (post.user_id !== user.id) {
        alert("본인이 작성한 글만 수정할 수 있습니다.");
        router.push(`/posts/${postId}`);
        return;
      }

      setTitle(post.title);
      setContent(post.content);
      setLoading(false);
    }

    loadPost();
  }, [postId, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      alert("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({
        title: trimmedTitle,
        content: trimmedContent,
      })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      console.error("게시글 수정 오류:", error);
      alert("게시글 수정에 실패했습니다.");
      setSaving(false);
      return;
    }

    alert("게시글이 수정되었습니다.");
    router.push(`/posts/${postId}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <p className="text-center text-gray-500">불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/posts/${postId}`}
          className="text-blue-500 hover:underline"
        >
          ← 게시글로 돌아가기
        </Link>

        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-xl bg-white p-6 shadow"
        >
          <h1 className="text-2xl font-bold">게시글 수정</h1>

          <div className="mt-6">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700"
            >
              제목
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="content"
              className="block text-sm font-semibold text-gray-700"
            >
              내용
            </label>

            <textarea
              id="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={12}
              className="mt-2 w-full resize-none rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Link
              href={`/posts/${postId}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              취소
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : "수정 완료"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}