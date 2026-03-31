"use client";

import {
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export default function GraphRagLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const navId = useId();
  const [navOpen, setNavOpen] = useState(false);
  const isLg = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (navOpen && !isLg) {
      root.style.overflow = "hidden";
    } else {
      root.style.overflow = "";
    }
    return () => {
      root.style.overflow = "";
    };
  }, [navOpen, isLg]);

  return (
    <div className="flex min-h-screen bg-[var(--dream-paper)] text-[var(--dream-ink)]">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        className={cn(
          "fixed inset-0 z-40 bg-[color-mix(in_oklch,var(--dream-ink)_45%,black)]/35 backdrop-blur-[2px] transition-opacity lg:pointer-events-none lg:opacity-0",
          navOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setNavOpen(false)}
      />

      <aside
        id={navId}
        className={cn(
          "flex w-56 flex-col gap-4 border-r border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] bg-[color-mix(in_oklch,var(--dream-ink)_4%,white)] px-3 py-6 shadow-[4px_0_24px_color-mix(in_oklch,var(--dream-ink)_12%,transparent)] transition-[transform,visibility] duration-200 ease-out sm:w-60 sm:px-4",
          "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:shadow-none",
          navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="图书知识图谱侧栏"
        inert={!isLg && !navOpen ? true : undefined}
      >
        <nav className="flex flex-col gap-1" aria-label="主导航">
          {NAV.map((item) => {
            const active = navItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setNavOpen(false)}
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
            onClick={() => setNavOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-[color-mix(in_oklch,var(--dream-ink)_55%,transparent)] transition hover:bg-[color-mix(in_oklch,var(--dream-ink)_6%,white)] hover:text-[var(--dream-ink)]"
          >
            ← 返回梦想乐园
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--background)] shadow-[inset_0_1px_0_color-mix(in_oklch,var(--dream-ink)_6%,transparent)]">
        <div className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-[var(--background)] px-3 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-[var(--dream-ink)] hover:bg-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)]"
            aria-expanded={navOpen}
            aria-controls={navId}
            aria-label={navOpen ? "收起导航菜单" : "展开导航菜单"}
            onClick={() => setNavOpen((o) => !o)}
          >
            {navOpen ? (
              <ChevronsLeft className="size-5" aria-hidden />
            ) : (
              <ChevronsRight className="size-5" aria-hidden />
            )}
          </Button>
          <span className="truncate text-sm font-semibold text-[color-mix(in_oklch,var(--dream-ink)_78%,transparent)]">
            图书知识图谱
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
