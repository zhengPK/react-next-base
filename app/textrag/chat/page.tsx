"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, MessageCircle, Plus, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type KnowledgeItem = {
  id: string;
  name: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  knowledgeId?: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

const KNOWLEDGE_KEY = "textrag_knowledge_items";
const CHAT_SESSIONS_KEY = "textrag_chat_sessions";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function ChatPage() {
  const [knowledgeOptions, setKnowledgeOptions] = useState<KnowledgeItem[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);

  const [draft, setDraft] = useState("");

  const draftTrimmed = draft.trim();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) ?? null;
  }, [activeSessionId, sessions]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions]);

  useEffect(() => {
    const knowledgeRaw = localStorage.getItem(KNOWLEDGE_KEY);
    const knowledgeItems = safeParseJson<KnowledgeItem[]>(knowledgeRaw, []);
    const t = window.setTimeout(() => {
      setKnowledgeOptions(knowledgeItems);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const savedSessions = safeParseJson<ChatSession[]>(
      localStorage.getItem(CHAT_SESSIONS_KEY),
      []
    );
    const t = window.setTimeout(() => {
      setSessions(savedSessions);
      if (savedSessions.length > 0) setActiveSessionId(savedSessions[0].id);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (!knowledgeOptions.length) return;
    if (selectedKnowledgeId) return;
    const t = window.setTimeout(() => {
      setSelectedKnowledgeId(knowledgeOptions[0].id);
    }, 0);
    return () => window.clearTimeout(t);
  }, [knowledgeOptions, selectedKnowledgeId]);

  useEffect(() => {
    // 追加消息后滚动到底部
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeSession?.messages.length]);

  const ensureSession = useCallback(() => {
    if (activeSession) return activeSession;

    const now = Date.now();
    const next: ChatSession = {
      id: uid(),
      title: "新会话",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
    return next;
  }, [activeSession]);

  const onNewChat = useCallback(() => {
    const now = Date.now();
    const next: ChatSession = {
      id: uid(),
      title: "新会话",
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
  }, []);

  const onClearAll = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem(CHAT_SESSIONS_KEY);
  }, []);

  const sendMessage = useCallback(() => {
    if (!draftTrimmed) return;

    const now = Date.now();
    const session = ensureSession();

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: draftTrimmed,
      createdAt: now,
      knowledgeId: selectedKnowledgeId || undefined,
    };

    setDraft("");

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== session.id) return s;
        const nextMessages = [...s.messages, userMsg];
        const nextTitle =
          s.title === "新会话" ? draftTrimmed.slice(0, 20) : s.title;
        return { ...s, messages: nextMessages, title: nextTitle, updatedAt: Date.now() };
      })
    );

    // 演示 assistant 回复（占位）
    window.setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: "收到问题。我会基于知识库内容生成回答（演示占位）。",
        createdAt: Date.now(),
        knowledgeId: selectedKnowledgeId || undefined,
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== session.id) return s;
          return { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() };
        })
      );
    }, 450);
  }, [draftTrimmed, ensureSession, selectedKnowledgeId]);

  return (
    <div className="dream-grain relative">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex gap-4">
          {/* 左侧会话 */}
          <aside className="w-[280px] rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-sky-600" strokeWidth={1.75} aria-hidden />
                <span className="text-sm font-semibold text-neutral-900">聊天会话</span>
              </div>
              <Button
                size="sm"
                className="h-8 rounded-xl bg-blue-600 px-3 text-white hover:bg-blue-700"
                onClick={onNewChat}
              >
                <Plus className="mr-1" aria-hidden />
                新建
              </Button>
            </div>

            <div className="mt-5 rounded-xl border border-black/5 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-neutral-600">对话</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-neutral-600 hover:bg-neutral-100"
                  onClick={onClearAll}
                  disabled={sessions.length === 0}
                >
                  <Trash2 className="mr-1" aria-hidden />
                  清空所有
                </Button>
              </div>

              <div className="mt-3 flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                {sortedSessions.length === 0 ? (
                  <div className="rounded-xl border border-black/5 bg-neutral-50/60 p-3 text-xs text-neutral-600">
                    还没有会话，点击“新建”开始。
                  </div>
                ) : null}

                {sortedSessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSessionId(s.id)}
                      className={[
                        "group flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition",
                        isActive ? "border-blue-200 bg-blue-50/60" : "border-transparent bg-white/60 hover:border-black/5 hover:bg-white",
                      ].join(" ")}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-sky-600 opacity-80" aria-hidden />
                          <span className="truncate text-sm font-medium text-neutral-900">{s.title}</span>
                        </div>
                        <div className="mt-1 truncate text-xs text-neutral-500">
                          {s.messages.length > 0 ? s.messages[s.messages.length - 1].content : "暂无消息"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* 右侧聊天 */}
          <section className="flex flex-1 flex-col rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-black/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-black/5">
                  <MessageCircle className="size-5 text-sky-600" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <h2 className="font-[family-name:var(--font-syne)] text-base font-bold text-[var(--dream-ink)]">
                    对话
                  </h2>
                </div>
              </div>

              <div className="min-w-[240px]">
                <Select value={selectedKnowledgeId} onValueChange={setSelectedKnowledgeId}>
                  <SelectTrigger className="rounded-xl bg-white/90">
                    <SelectValue placeholder="选择知识库" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {knowledgeOptions.length === 0 ? (
                      <SelectItem value="" disabled>
                        -- 请选择知识库 --
                      </SelectItem>
                    ) : null}
                    {knowledgeOptions.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-[60vh] overflow-hidden">
              <div ref={scrollRef} className="h-full overflow-auto px-6 py-8">
                {activeSession?.messages.length ? (
                  <div className="flex flex-col gap-4">
                    {activeSession.messages.map((m) => {
                      const isUser = m.role === "user";
                      return (
                        <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                          <div
                            className={[
                              "max-w-[72%] rounded-2xl border px-4 py-3 text-sm leading-relaxed",
                              isUser
                                ? "border-blue-200 bg-blue-600/10 text-neutral-900"
                                : "border-black/5 bg-white text-neutral-900",
                            ].join(" ")}
                          >
                            {m.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-10 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-black/5 bg-white/90">
                      <MessageCircle className="size-6 text-sky-600" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div className="mt-3 text-sm font-medium text-neutral-600">开始提问吧！</div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-black/5 px-5 py-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="输入您的问题..."
                    className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-white/95 px-4 py-3"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!draftTrimmed}
                  className="h-11 rounded-2xl bg-blue-600 px-5 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="mr-2" aria-hidden />
                  发送
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

