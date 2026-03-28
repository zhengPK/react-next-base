import Link from "next/link";

export default function graphRAG() {
  return (
    <div className="dream-grain relative min-h-full flex-1 px-4 py-16 sm:px-8 sm:py-24">
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="dream-animate-in mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--dream-copper)]">
          GraphRAG
        </p>
        <h1 className="dream-animate-in dream-animate-in-delay-1 font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-[var(--dream-ink)] sm:text-5xl">
          图检索增强生成
        </h1>
        <p className="dream-animate-in dream-animate-in-delay-2 mt-6 text-base leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_62%,transparent)]">
          此页面为占位入口，后续可在此接入图结构知识库与可视化。
        </p>
        <div className="dream-animate-in dream-animate-in-delay-3 mt-10 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-[color-mix(in_oklch,var(--dream-copper)_45%,transparent)] to-transparent" />
        <Link
          href="/"
          className="dream-animate-in dream-animate-in-delay-3 mt-10 inline-flex items-center rounded-full border border-[color-mix(in_oklch,var(--dream-ink)_12%,transparent)] bg-white/80 px-6 py-2.5 text-sm font-medium text-[var(--dream-ink)] shadow-sm ring-1 ring-[color-mix(in_oklch,var(--dream-ink)_6%,transparent)] backdrop-blur transition hover:border-[var(--dream-copper)] hover:text-[var(--dream-copper-dim)]"
        >
          ← 返回梦想乐园
        </Link>
      </div>
    </div>
  );
}
