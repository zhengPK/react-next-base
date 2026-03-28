"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="dream-grain relative flex min-h-full flex-1 flex-col px-4 py-12 sm:px-8 sm:py-20">
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <header className="dream-animate-in mb-14 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--dream-copper)]">
            Dreamland
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--dream-ink)] text-balance sm:text-5xl lg:text-6xl">
            梦想乐园
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_62%,transparent)] sm:text-lg">
            用 AI 创造梦想——选择一条路径，进入文本或图结构的知识检索世界。
          </p>
          <div className="mt-8 h-px w-24 bg-gradient-to-r from-[var(--dream-copper)] to-transparent" />
        </header>

        <main className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <Card
            size="sm"
            className="dream-animate-in dream-animate-in-delay-1 group/card overflow-hidden border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] bg-white/70 shadow-[0_24px_80px_-32px_rgba(20,17,15,0.35)] ring-1 ring-[color-mix(in_oklch,var(--dream-ink)_6%,transparent)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[0_28px_90px_-28px_rgba(196,92,38,0.35)]"
          >
            <div className="h-1.5 bg-gradient-to-r from-[var(--dream-teal)] via-[var(--dream-teal)] to-[color-mix(in_oklch,var(--dream-teal)_40%,white)]" />
            <CardHeader className="pb-2">
              <CardTitle className="font-[family-name:var(--font-syne)] text-xl tracking-tight">
                TextRAG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_65%,transparent)]">
                文本检索增强生成（RAG）是一种结合了信息检索和生成模型的技术，旨在提高自然语言处理任务中的性能和准确性。
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[color-mix(in_oklch,var(--dream-teal)_35%,transparent)] bg-white/80 text-[var(--dream-teal)] transition hover:border-[var(--dream-teal)] hover:bg-[color-mix(in_oklch,var(--dream-teal)_6%,white)]"
              >
                <Link href="/textrag" className="w-full text-center">
                  TextRAG
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card
            size="sm"
            className="dream-animate-in dream-animate-in-delay-2 group/card overflow-hidden border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] bg-white/70 shadow-[0_24px_80px_-32px_rgba(20,17,15,0.35)] ring-1 ring-[color-mix(in_oklch,var(--dream-ink)_6%,transparent)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[0_28px_90px_-28px_rgba(196,92,38,0.35)]"
          >
            <div className="h-1.5 bg-gradient-to-r from-[var(--dream-copper)] via-[var(--dream-copper-dim)] to-[color-mix(in_oklch,var(--dream-copper)_50%,white)]" />
            <CardHeader className="pb-2">
              <CardTitle className="font-[family-name:var(--font-syne)] text-xl tracking-tight">
                GraphRAG
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_65%,transparent)]">
                图检索增强生成（RAG）是一种结合了信息检索和生成模型的技术，旨在提高自然语言处理任务中的性能和准确性。
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[color-mix(in_oklch,var(--dream-copper)_40%,transparent)] bg-white/80 text-[var(--dream-copper-dim)] transition hover:border-[var(--dream-copper)] hover:bg-[color-mix(in_oklch,var(--dream-copper)_8%,white)]"
              >
                <Link href="/graphrag" className="w-full text-center">
                  GraphRAG
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </div>
  );
}
