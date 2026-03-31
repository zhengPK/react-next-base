"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/graphrag", label: "首页" },
  { href: "/graphrag/import", label: "数据导入" },
  { href: "/graphrag/qa", label: "问答系统" },
] as const;

function navItemActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/graphrag") {
    return pathname === "/graphrag" || pathname === "/graphrag/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function GraphRagLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--dream-paper)] text-[var(--dream-ink)]">
      <aside
        className="flex w-56 shrink-0 flex-col gap-4 border-r border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] bg-[color-mix(in_oklch,var(--dream-ink)_4%,white)] px-3 py-6 sm:w-60 sm:px-4"
        aria-label="图书知识图谱侧栏"
      >
        <nav className="flex flex-col gap-1" aria-label="主导航">
          {NAV.map((item) => {
            const active = navItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? item.href === "/graphrag/qa"
                      ? "bg-[color-mix(in_oklch,var(--dream-teal)_14%,white)] text-[var(--dream-teal)] ring-1 ring-[color-mix(in_oklch,var(--dream-teal)_22%,transparent)]"
                      : "bg-[color-mix(in_oklch,var(--dream-ink)_10%,white)] text-[var(--dream-ink)] ring-1 ring-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)]"
                    : "text-[color-mix(in_oklch,var(--dream-ink)_72%,transparent)] hover:bg-[color-mix(in_oklch,var(--dream-ink)_6%,white)] hover:text-[var(--dream-ink)]"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] pt-4">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-xs font-medium text-[color-mix(in_oklch,var(--dream-ink)_55%,transparent)] transition hover:bg-[color-mix(in_oklch,var(--dream-ink)_6%,white)] hover:text-[var(--dream-ink)]"
          >
            ← 返回梦想乐园
          </Link>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--background)] shadow-[inset_0_1px_0_color-mix(in_oklch,var(--dream-ink)_6%,transparent)]">
        {children}
      </div>
    </div>
  );
}
