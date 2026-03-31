import Link from "next/link";

import { Separator } from "@/components/ui/separator";

export default function GraphRagHomePage() {
  return (
    <div className="flex min-h-full flex-col px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
      <header className="flex flex-col gap-4">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--dream-ink)] sm:text-4xl">
          图书知识图谱系统
        </h1>
        <Separator className="bg-[color-mix(in_oklch,var(--dream-ink)_12%,transparent)]" />
      </header>

      <div className="mt-8 flex max-w-2xl flex-col gap-8">
        <p className="text-base leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_68%,transparent)]">
          欢迎使用图书知识图谱系统！
        </p>

        <section className="flex flex-col gap-4">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight text-[var(--dream-ink)]">
            功能模块
          </h2>
          <ol className="list-decimal pl-6 text-sm leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_72%,transparent)] marker:font-medium marker:text-[var(--dream-ink)] sm:text-base [&>li+li]:mt-3">
            <li className="pl-2">
              <Link
                href="/graphrag/import"
                className="font-medium text-[var(--dream-ink)] underline-offset-4 transition hover:text-[var(--dream-copper-dim)] hover:underline"
              >
                数据导入
              </Link>
              <span className="text-[color-mix(in_oklch,var(--dream-ink)_55%,transparent)]">
                {" "}
                — 导入 CSV 数据并生成向量
              </span>
            </li>
            <li className="pl-2">
              <Link
                href="/graphrag/qa"
                className="font-medium text-[var(--dream-ink)] underline-offset-4 transition hover:text-[var(--dream-copper-dim)] hover:underline"
              >
                问答系统
              </Link>
              <span className="text-[color-mix(in_oklch,var(--dream-ink)_55%,transparent)]">
                {" "}
                — 基于向量检索的智能问答
              </span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
