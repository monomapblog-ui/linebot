import { shopConfig } from "@/config/shop";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            AI自動応答LINEボット
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            コース・クーポンに関するよくある質問へ、Claude APIが自動応答するプロトタイプです。
          </p>
        </div>

        <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Webhookエンドポイント
          </h2>
          <code className="mt-1 block text-black dark:text-zinc-50">
            POST /api/line/webhook
          </code>
        </section>

        <section className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            設定中の店舗（ダミーデータ）
          </h2>
          <p className="mt-1 text-black dark:text-zinc-50">{shopConfig.shopName}</p>
          <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {shopConfig.courses.map((course) => (
              <li key={`${course.name}-${course.durationMinutes}`}>
                {course.name}（{course.durationMinutes}分）: {course.price.toLocaleString()}円
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          店舗情報は <code>src/config/shop.ts</code> を編集して変更できます。ローカルでの動作確認は{" "}
          <code>npm run mock:line</code> を参照してください。
        </p>
      </main>
    </div>
  );
}
