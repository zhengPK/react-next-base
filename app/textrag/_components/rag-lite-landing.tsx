"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  BookOpen,
  Bot,
  FileText,
  FolderOpen,
  Info,
  MessageCircle,
  Search,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function subscribeTextragAuth(cb: () => void) {
  window.addEventListener("textrag-auth", cb);
  return () => window.removeEventListener("textrag-auth", cb);
}

function getTextragLoggedInSnapshot() {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem("textrag_token");
}

function useTextragLoggedIn() {
  return useSyncExternalStore(
    subscribeTextragAuth,
    getTextragLoggedInSnapshot,
    () => false
  );
}

export function RagLiteLanding({ showGuestTip = false }: { showGuestTip?: boolean }) {
  const loggedIn = useTextragLoggedIn();

  const signInHref = "/textrag/login";
  const knowledgeHref = loggedIn ? "/textrag/knowledge" : signInHref;
  const chatHref = loggedIn ? "/textrag/chat" : signInHref;

  return (
    <div className="dream-grain relative z-0 min-h-[calc(100vh-56px)]">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {showGuestTip && !loggedIn ? (
          <div
            className="mb-8 flex gap-3 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 shadow-sm sm:items-center"
            role="status"
          >
            <Info
              className="mt-0.5 size-5 shrink-0 text-sky-600 sm:mt-0"
              strokeWidth={2}
              aria-hidden
            />
            <p className="leading-relaxed">
              提示：访问知识库管理和聊天功能需要先{" "}
              <Link
                href="/textrag/login"
                className="font-semibold text-sky-700 underline-offset-2 hover:underline"
              >
                登录
              </Link>{" "}
              或{" "}
              <Link
                href="/textrag/register"
                className="font-semibold text-sky-700 underline-offset-2 hover:underline"
              >
                注册
              </Link>
              。
            </p>
          </div>
        ) : null}

        <section className="mb-14 text-center sm:mb-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
            <BookOpen
              className="size-16 text-blue-600 sm:size-20"
              strokeWidth={1.15}
              aria-hidden
            />
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-extrabold tracking-tight text-[var(--dream-ink)] sm:text-5xl">
              RAG Lite
            </h1>
            <p className="text-lg text-neutral-800 sm:text-xl">
              RAG（检索增强生成）系统
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              基于 LangChain 和 DeepSeek API
              构建的轻量级知识库问答系统
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={knowledgeHref} />}
                className="h-11 gap-2 rounded-xl border-0 bg-blue-600 px-6 text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
              >
                <FolderOpen className="size-4" aria-hidden />
                知识库管理
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href={chatHref} />}
                className="h-11 gap-2 rounded-xl border-2 border-blue-600 bg-white px-6 text-blue-600 hover:bg-blue-50"
              >
                <MessageCircle className="size-4" aria-hidden />
                开始聊天
              </Button>
            </div>
          </div>
        </section>

        <section className="mb-14 sm:mb-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="gap-0 border-neutral-200/90 bg-white/90 py-0 shadow-md ring-1 ring-black/5">
              <CardHeader className="pb-2 pt-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-blue-50">
                  <FileText
                    className="size-6 text-blue-600"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <CardTitle className="text-base font-semibold text-neutral-900">
                  文档管理
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-0">
                <CardDescription className="text-sm leading-relaxed text-neutral-600">
                  支持 PDF、DOCX、TXT、MD
                  等多种格式文档上传和管理
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="gap-0 border-neutral-200/90 bg-white/90 py-0 shadow-md ring-1 ring-black/5">
              <CardHeader className="pb-2 pt-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-blue-50">
                  <Search
                    className="size-6 text-blue-600"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <CardTitle className="text-base font-semibold text-neutral-900">
                  智能检索
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-0">
                <CardDescription className="text-sm leading-relaxed text-neutral-600">
                  基于向量相似度的智能文档检索，快速找到相关内容
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="gap-0 border-neutral-200/90 bg-white/90 py-0 shadow-md ring-1 ring-black/5">
              <CardHeader className="pb-2 pt-5">
                <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-blue-50">
                  <Bot
                    className="size-6 text-blue-600"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <CardTitle className="text-base font-semibold text-neutral-900">
                  智能问答
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-5 pt-0">
                <CardDescription className="text-sm leading-relaxed text-neutral-600">
                  基于文档内容的智能问答，支持流式输出和 Markdown 渲染
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <div className="rounded-2xl border border-neutral-200 bg-white/95 p-6 shadow-sm sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-neutral-900">
              <Zap
                className="size-5 text-amber-500"
                fill="currentColor"
                strokeWidth={1.5}
                aria-hidden
              />
              快速开始
            </h2>
            <ol className="space-y-5 text-left">
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  1
                </span>
                <div>
                  <p className="font-semibold text-neutral-900">创建知识库</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    在知识库管理页面创建新的知识库，设置分块参数和检索参数
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  2
                </span>
                <div>
                  <p className="font-semibold text-neutral-900">上传文档</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    在知识库详情页面上传文档，系统会自动解析、分块和向量化
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  3
                </span>
                <div>
                  <p className="font-semibold text-neutral-900">开始问答</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    在聊天页面选择知识库，输入问题即可获得基于文档内容的智能回答
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
