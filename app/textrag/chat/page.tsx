"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Loader2, MessageCircle, Plus, Send, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createChatSession,
  deleteAllChatSessions,
  deleteChatSession,
  getChatSession,
  listAllKnowledgeBases,
  listChatSessions,
  streamTextRagChat,
  type ChatMessageApi,
  type ChatSessionApi,
} from "@/lib/chat-api";

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

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeDate(iso?: string | null): number {
  if (!iso) return Date.now();
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : Date.now();
}

function mapApiMessage(m: ChatMessageApi): ChatMessage {
  const role = m.role === "user" || m.role === "assistant" ? m.role : "user";
  return {
    id: m.id,
    role,
    content: m.content ?? "",
    createdAt: safeDate(m.created_at),
  };
}

function mapApiSession(s: ChatSessionApi, messages: ChatMessage[] = []): ChatSession {
  return {
    id: s.id,
    title: s.title?.trim() ? s.title : "新对话",
    messages,
    createdAt: safeDate(s.created_at),
    updatedAt: safeDate(s.updated_at),
  };
}

/** Select 用：与真实知识库 id 不冲突的哨兵，表示不绑定知识库、直连大模型 */
const NO_KNOWLEDGE_SELECT_VALUE = "__no_knowledge__";

export default function ChatPage() {
  const [knowledgeOptions, setKnowledgeOptions] = useState<KnowledgeItem[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newChatLoading, setNewChatLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [kbListLoading, setKbListLoading] = useState(true);
  const [kbListError, setKbListError] = useState<string | null>(null);

  const draftTrimmed = draft.trim();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    return sessions.find((s) => s.id === activeSessionId) ?? null;
  }, [activeSessionId, sessions]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions]);

  const loadSessionList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const data = await listChatSessions(1, 500);
      const cur = activeSessionIdRef.current;
      const nextActive =
        cur && data.items.some((i) => i.id === cur)
          ? cur
          : data.items[0]?.id ?? null;

      setSessions((prev) => {
        const byId = new Map(prev.map((s) => [s.id, s]));
        return data.items.map((item) => {
          const old = byId.get(item.id);
          return mapApiSession(item, old?.messages ?? []);
        });
      });
      setActiveSessionId(nextActive);

      if (nextActive) {
        setDetailLoading(true);
        try {
          const detail = await getChatSession(nextActive);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === nextActive
                ? mapApiSession(detail.session, detail.messages.map(mapApiMessage))
                : s,
            ),
          );
        } catch (e) {
          setActionError(e instanceof Error ? e.message : "加载会话消息失败");
        } finally {
          setDetailLoading(false);
        }
      }
    } catch (e) {
      setListError(e instanceof Error ? e.message : "加载会话列表失败");
    } finally {
      setListLoading(false);
    }
  }, []);

  const selectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setDetailLoading(true);
    setActionError(null);
    try {
      const detail = await getChatSession(sessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? mapApiSession(detail.session, detail.messages.map(mapApiMessage))
            : s,
        ),
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "加载会话失败");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setKbListError(null);
    setKbListLoading(true);
    void (async () => {
      try {
        const items = await listAllKnowledgeBases();
        if (cancelled) return;
        setKnowledgeOptions(items);
      } catch (e) {
        if (cancelled) return;
        setKbListError(e instanceof Error ? e.message : "加载知识库列表失败");
        setKnowledgeOptions([]);
      } finally {
        if (!cancelled) setKbListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadSessionList();
  }, [loadSessionList]);

  useEffect(() => {
    if (!knowledgeOptions.length) {
      setSelectedKnowledgeId(null);
      return;
    }
    setSelectedKnowledgeId((cur) => {
      if (cur && knowledgeOptions.some((k) => k.id === cur)) return cur;
      return null;
    });
  }, [knowledgeOptions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeSession?.messages]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const onNewChat = useCallback(async () => {
    setNewChatLoading(true);
    setActionError(null);
    try {
      const created = await createChatSession();
      const next = mapApiSession(created, []);
      setSessions((prev) => [next, ...prev.filter((s) => s.id !== created.id)]);
      setActiveSessionId(created.id);
      setSelectedKnowledgeId(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "新建会话失败");
    } finally {
      setNewChatLoading(false);
    }
  }, []);

  const confirmClearAllSessions = useCallback(async () => {
    setClearAllDialogOpen(false);
    setActionError(null);
    abortRef.current?.abort();
    try {
      await deleteAllChatSessions();
      await loadSessionList();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "清空失败");
    }
  }, [loadSessionList]);

  const requestDeleteSession = useCallback(
    (e: React.MouseEvent, sessionId: string, title: string) => {
      e.stopPropagation();
      setDeleteSessionTarget({ id: sessionId, title });
    },
    [],
  );

  const confirmDeleteSession = useCallback(async () => {
    if (!deleteSessionTarget) return;
    const sessionId = deleteSessionTarget.id;
    setDeleteSessionTarget(null);
    setActionError(null);
    abortRef.current?.abort();
    try {
      await deleteChatSession(sessionId);
      await loadSessionList();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "删除失败");
    }
  }, [deleteSessionTarget, loadSessionList]);

  const sendMessage = useCallback(async () => {
    if (!draftTrimmed || isStreaming) return;

    setActionError(null);

    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const created = await createChatSession();
        sessionId = created.id;
        setSessions((prev) => [
          mapApiSession(created, []),
          ...prev.filter((s) => s.id !== created.id),
        ]);
        setActiveSessionId(created.id);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "创建会话失败");
        return;
      }
    }

    const now = Date.now();
    const question = draftTrimmed;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: question,
      createdAt: now,
      knowledgeId: selectedKnowledgeId || undefined,
    };

    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: now,
      knowledgeId: selectedKnowledgeId || undefined,
    };

    setDraft("");

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const nextTitle = s.title === "新对话" ? question.slice(0, 20) : s.title;
        return {
          ...s,
          messages: [...s.messages, userMsg, assistantMsg],
          title: nextTitle,
          updatedAt: Date.now(),
        };
      }),
    );

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setIsStreaming(true);

    try {
      await streamTextRagChat(question, {
        session_id: sessionId,
        ...(selectedKnowledgeId ? { kb_id: selectedKnowledgeId } : {}),
        signal: ac.signal,
        onContentDelta: (delta) => {
          setSessions((prev) =>
            prev.map((s) => {
              if (s.id !== sessionId) return s;
              return {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + delta } : m,
                ),
                updatedAt: Date.now(),
              };
            }),
          );
        },
      });
    } catch (e) {
      const aborted =
        (e instanceof DOMException && e.name === "AbortError") ||
        (e instanceof Error && e.name === "AbortError");
      if (aborted) return;

      const msg = e instanceof Error ? e.message : "生成失败";
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: m.content
                      ? `${m.content}\n\n[错误] ${msg}`
                      : `[错误] ${msg}`,
                  }
                : m,
            ),
            updatedAt: Date.now(),
          };
        }),
      );
    } finally {
      setIsStreaming(false);
      if (abortRef.current === ac) abortRef.current = null;
    }
  }, [draftTrimmed, activeSessionId, isStreaming, selectedKnowledgeId]);

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
                onClick={() => void onNewChat()}
                disabled={newChatLoading || listLoading}
              >
                {newChatLoading ? (
                  <Loader2 className="mr-1 size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Plus className="mr-1" aria-hidden />
                )}
                新建
              </Button>
            </div>

            {listError ? (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50/80 p-3 text-xs text-red-800">
                {listError}
              </div>
            ) : null}
            {actionError ? (
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-900">
                {actionError}
              </div>
            ) : null}
            {kbListError ? (
              <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/80 p-3 text-xs text-amber-900">
                知识库列表：{kbListError}
              </div>
            ) : null}

            <div className="mt-5 rounded-xl border border-black/5 bg-white/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-neutral-600">对话</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-neutral-600 hover:bg-neutral-100"
                  onClick={() => setClearAllDialogOpen(true)}
                  disabled={sessions.length === 0 || listLoading}
                >
                  <Trash2 className="mr-1" aria-hidden />
                  清空所有
                </Button>
              </div>

              <div className="mt-3 flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
                {listLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-black/5 bg-neutral-50/60 p-4 text-xs text-neutral-600">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    加载会话…
                  </div>
                ) : null}

                {!listLoading && sortedSessions.length === 0 ? (
                  <div className="rounded-xl border border-black/5 bg-neutral-50/60 p-3 text-xs text-neutral-600">
                    还没有会话，点击“新建”开始。
                  </div>
                ) : null}

                {sortedSessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const preview =
                    s.messages.length > 0
                      ? s.messages[s.messages.length - 1].content
                      : "暂无消息";
                  return (
                    <div
                      key={s.id}
                      className={[
                        "group flex w-full items-start justify-between gap-2 rounded-xl border p-3 text-left transition",
                        isActive ? "border-blue-200 bg-blue-50/60" : "border-transparent bg-white/60 hover:border-black/5 hover:bg-white",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => void selectSession(s.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 shrink-0 text-sky-600 opacity-80" aria-hidden />
                          <span className="truncate text-sm font-medium text-neutral-900">{s.title}</span>
                        </div>
                        <div className="mt-1 truncate text-xs text-neutral-500">{preview}</div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-neutral-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="删除会话"
                        onClick={(e) => requestDeleteSession(e, s.id, s.title)}
                        disabled={listLoading}
                        aria-label="删除会话"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
                <Select
                  value={selectedKnowledgeId ?? NO_KNOWLEDGE_SELECT_VALUE}
                  onValueChange={(v) =>
                    setSelectedKnowledgeId(v === NO_KNOWLEDGE_SELECT_VALUE ? null : v)
                  }
                  disabled={kbListLoading}
                >
                  <SelectTrigger className="rounded-xl bg-white/90">
                    <SelectValue
                      placeholder={
                        kbListLoading
                          ? "加载知识库…"
                          : knowledgeOptions.length === 0
                            ? "暂无知识库（可不选）"
                            : "选择知识库"
                      }
                    >
                      {(v) => {
                        if (kbListLoading) return "加载知识库…";
                        if (v === NO_KNOWLEDGE_SELECT_VALUE || v == null) {
                          return "未选择知识库";
                        }
                        const name = knowledgeOptions.find((k) => k.id === v)?.name;
                        return name?.trim() ? name : "知识库不可用";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={NO_KNOWLEDGE_SELECT_VALUE}>未选择知识库</SelectItem>
                    {knowledgeOptions.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="relative h-[60vh] overflow-hidden">
              {detailLoading ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                  <Loader2 className="size-8 animate-spin text-sky-600" aria-hidden />
                </div>
              ) : null}
              <div ref={scrollRef} className="h-full overflow-auto px-6 py-8">
                {activeSession?.messages.length ? (
                  <div className="flex flex-col gap-4">
                    {activeSession.messages.map((m) => {
                      const isUser = m.role === "user";
                      const isPendingAssistant =
                        !isUser &&
                        isStreaming &&
                        m.id === activeSession.messages[activeSession.messages.length - 1]?.id &&
                        !m.content;
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
                            {isPendingAssistant ? (
                              <span className="inline-flex items-center gap-2 text-neutral-500">
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                                正在生成…
                              </span>
                            ) : (
                              m.content || (
                                <span className="text-neutral-400">（空回复）</span>
                              )
                            )}
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
                        void sendMessage();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => void sendMessage()}
                  disabled={!draftTrimmed || isStreaming}
                  className="h-11 rounded-2xl bg-blue-600 px-5 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isStreaming ? (
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="mr-2" aria-hidden />
                  )}
                  {isStreaming ? "生成中" : "发送"}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <AlertDialog
        open={deleteSessionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSessionTarget(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>删除会话</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除会话「{deleteSessionTarget?.title ?? ""}」？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">取消</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={() => {
                void confirmDeleteSession();
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={clearAllDialogOpen}
        onOpenChange={(open) => {
          setClearAllDialogOpen(open);
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 aria-hidden />
            </AlertDialogMedia>
            <AlertDialogTitle>清空所有会话</AlertDialogTitle>
            <AlertDialogDescription>
              确定清空全部 {sessions.length} 个会话？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">取消</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={() => {
                void confirmClearAllSessions();
              }}
            >
              清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
