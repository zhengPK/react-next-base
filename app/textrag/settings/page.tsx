"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="dream-grain relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/70 ring-1 ring-black/5">
          <Settings className="size-5 text-sky-600" strokeWidth={1.75} />
        </span>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--dream-ink)]">
          设置
        </h1>
      </div>

      <div className="mt-6 rounded-2xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/80 p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_65%,transparent)]">
          该页面为设置占位。后续可以接入模型/Key/分块参数等配置。
        </p>
        <div className="mt-6">
          <Link
            href="/textrag"
            className="inline-flex items-center rounded-full bg-white/90 px-5 py-2.5 text-sm font-medium text-[var(--dream-ink)] ring-1 ring-black/5 hover:bg-white"
          >
            返回落地页
          </Link>
        </div>
      </div>
    </div>
  );
}

