"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Database,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Settings,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAndClear, readStoredUser } from "@/lib/auth";

const navLinkClass =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white/95 transition hover:bg-white/12 hover:text-white";

type TextragUser = { username: string } | null;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<TextragUser>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setUser(readStoredUser());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    function handleAuthChange() {
      setUser(readStoredUser());
    }

    window.addEventListener("textrag-auth", handleAuthChange);
    return () => window.removeEventListener("textrag-auth", handleAuthChange);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const isOnGuestEntry =
      pathname === "/textrag" ||
      pathname === "/textrag/login" ||
      pathname === "/textrag/register";
    const isProtected =
      pathname?.startsWith("/textrag/knowledge") ||
      pathname?.startsWith("/textrag/chat") ||
      pathname?.startsWith("/textrag/settings");

    if (isOnGuestEntry && user) {
      router.replace("/textrag");
      return;
    }
    if (isProtected && !user) {
      router.replace("/textrag");
      return;
    }
  }, [pathname, ready, router, user]);

  return (
    <div className="min-h-screen bg-[var(--dream-paper)] text-[var(--dream-ink)]">
      <header className="relative border-b border-[color-mix(in_oklch,var(--dream-ink)_8%,transparent)] bg-gradient-to-r from-[#0a2624] via-[#0d3f3a] to-[#122c28] shadow-[0_12px_40px_-20px_rgba(10,38,36,0.65)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/textrag"
            className="flex shrink-0 items-center gap-2 font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-white"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <BookOpen className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            RAG Lite
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="主导航"
          >
            <Link href="/textrag" className={navLinkClass}>
              <Home className="size-4" aria-hidden />
              首页
            </Link>

            {user ? (
              <>
                <Link
                  href="/textrag/knowledge"
                  className={pathname?.startsWith("/textrag/knowledge") ? `${navLinkClass} bg-white/12 text-white` : navLinkClass}
                >
                  <Database className="size-4" aria-hidden />
                  知识库
                </Link>
                <Link
                  href="/textrag/chat"
                  className={pathname?.startsWith("/textrag/chat") ? `${navLinkClass} bg-white/12 text-white` : navLinkClass}
                >
                  <MessageCircle className="size-4" aria-hidden />
                  聊天
                </Link>
                {/* <Link
                  href="/textrag/settings"
                  className={pathname?.startsWith("/textrag/settings") ? `${navLinkClass} bg-white/12 text-white` : navLinkClass}
                >
                  <Settings className="size-4" aria-hidden />
                  设置
                </Link> */}
              </>
            ) : null}
          </nav>

          {user ? (
            <details className="relative shrink-0">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white transition marker:content-none hover:bg-white/10 [&::-webkit-details-marker]:hidden">
                <User className="size-4" aria-hidden />
                <span className="max-w-[6rem] truncate">{user.username}</span>
                <ChevronDown className="size-4 opacity-90" aria-hidden />
              </summary>
              <div className="absolute right-0 top-full z-10 mt-2 min-w-[10rem] rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/95 py-1 text-sm text-[var(--dream-ink)] shadow-xl ring-1 ring-[color-mix(in_oklch,var(--dream-ink)_6%,transparent)] backdrop-blur-md">
                <Button
                  type="button"
                  onClick={async () => {
                    await logoutAndClear();
                    setUser(null);
                    router.replace("/textrag");
                  }}
                  variant="ghost"
                  className="h-auto w-full justify-start rounded-none px-3 py-2.5 text-left transition hover:bg-[color-mix(in_oklch,var(--dream-copper)_8%,white)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="size-4" aria-hidden />
                    退出登录
                  </span>
                </Button>
              </div>
            </details>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/textrag/login" className={navLinkClass}>
                <LogIn className="size-4" aria-hidden />
                登录
              </Link>
              <Link
                href="/textrag/register"
                className={`${navLinkClass} rounded-lg bg-white/10 ring-1 ring-white/20 hover:bg-white/18`}
              >
                <UserPlus className="size-4" aria-hidden />
                注册
              </Link>
            </div>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
