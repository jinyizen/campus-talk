import Link from "next/link";
export default function Home() {

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



        <div className="bg-white rounded-xl p-4 shadow mb-4">

          <h2 className="font-bold text-lg">

            브리핑 

          </h2>

          <p className="text-gray-500 mt-2">

            잼얘ㄱ 

          </p>

          <p className="mt-3">

            💬 댓글 3개

          </p>

        </div>



        <div className="bg-white rounded-xl p-4 shadow mb-4">

          <h2 className="font-bold text-lg">

            같이 로블록스할 사람? 

          </h2>

          <p className="text-gray-500 mt-2">

            저녁에 같이 할 사람 구함

          </p>

          <p className="mt-3">

            💬 댓글 5개

          </p>

        </div>



        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-around">

          <span>🏠 홈</span>

          <span>💬 채팅</span>

          <span>👤 내정보</span>

        </div>



      </div>

    </main>

  );

}