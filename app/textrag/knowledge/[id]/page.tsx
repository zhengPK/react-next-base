"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  FileText,
  FileUp,
  Info,
  LayoutList,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import {
  DocumentChunksDialog,
  type DocumentChunkRow,
} from "../_components/document-chunks-dialog";

import { apiFetch } from "@/lib/auth";

type DocumentStatus = "pending" | "processing" | "done" | "failed";

type KnowledgeDocument = {
  id: string;
  knowledgeId: string;
  fileName: string;
  status: DocumentStatus;
  chunkCount: number | string;
  fileSize: number;
  createdAt: number | string;
  updatedAt: number | string;
};

type ApiDocumentItem = {
  id: string;
  kb_id: string;
  name: string;
  file_size: number;
  chunk_count: number | string;
  status: string;
  created_at?: number | string;
  updated_at?: number | string;
};

type KbDetailData = {
  items: ApiDocumentItem[];
  pagination?: { total: number; page: number; page_size: number };
};

function mapApiDocumentToRow(
  raw: ApiDocumentItem,
  knowledgeId: string,
): KnowledgeDocument {
  const statusMap: Record<string, DocumentStatus> = {
    pending: "pending",
    processing: "processing",
    completed: "done",
    failed: "failed",
  };
  const status = statusMap[raw.status] ?? "pending";
  return {
    id: raw.id,
    knowledgeId: raw.kb_id ?? knowledgeId,
    fileName: raw.name,
    status,
    chunkCount: raw.chunk_count ?? 0,
    fileSize: Number(raw.file_size ?? 0),
    createdAt: raw.created_at || "",
    updatedAt: raw.updated_at || "",
  };
}

function formatBytes(bytes: number) {
  const b = Math.max(0, bytes);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function KnowledgeDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const knowledgeName = searchParams.get("name");
  const knowledgeId = params.id;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listRefreshHint, setListRefreshHint] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    fileName: string;
  } | null>(null);

  const [chunksOpen, setChunksOpen] = useState(false);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [chunksDoc, setChunksDoc] = useState<{
    id: string;
    fileName: string;
  } | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkRow[]>([]);

  const loadDocuments = useCallback(async () => {
    if (!knowledgeId) return;
    const res = await apiFetch(`/textRag/kb/detail/${knowledgeId}`, {
      method: "GET",
    });
    const json = (await res.json()) as {
      code?: number;
      data?: KbDetailData;
    };
    if (json.code === 200 && json.data?.items) {
      setDocuments(
        json.data.items.map((row) => mapApiDocumentToRow(row, knowledgeId)),
      );
    } else {
      setDocuments([]);
    }
  }, [knowledgeId]);

  useEffect(() => {
    if (!knowledgeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      try {
        await loadDocuments();
      } catch {
        if (!cancelled) {
          setDocuments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [knowledgeId, loadDocuments]);

  const handleRefreshDocuments = useCallback(async () => {
    if (!knowledgeId) return;
    setRefreshing(true);
    setActionError(null);
    try {
      await loadDocuments();
      setListRefreshHint(null);
    } catch {
      setActionError("刷新失败，请稍后重试");
    } finally {
      setRefreshing(false);
    }
  }, [knowledgeId, loadDocuments]);

  const statusBadgeClass = useMemo(() => {
    const map: Record<DocumentStatus, string> = {
      pending:
        "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-100",
      processing:
        "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-50",
      done: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50",
      failed:
        "border-red-200 bg-red-50 text-red-800 hover:bg-red-50",
    };
    return map;
  }, []);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!knowledgeId || files.length === 0) return;

    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      await apiFetch(`/textRag/documents/${knowledgeId}`, {
        method: "POST",
        body: fd,
      });
    }

    await loadDocuments();

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onProcessDocument(docId: string) {
    if (!knowledgeId) return;

    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    if (doc.status !== "pending" && doc.status !== "failed") return;

    setActionError(null);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "processing" } : d)),
    );

    try {
      const res = await apiFetch(`/textRag/documents/${docId}/process`, {
        method: "POST",
      });
      const json = (await res.json()) as { code?: number; message?: string };
      if (json.code !== 200) {
        setActionError(json.message ?? "提交处理失败");
        await loadDocuments();
        return;
      }
      setListRefreshHint(
        "处理任务已提交，请点击上方「刷新」按钮重新获取文档列表状态。",
      );
    } catch {
      setActionError("网络错误，请稍后重试");
      await loadDocuments();
    }
  }

  async function onReprocessDocument(docId: string) {
    if (!knowledgeId) return;
    const doc = documents.find((d) => d.id === docId);
    if (!doc || doc.status !== "done") return;

    setActionError(null);
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "processing" } : d)),
    );

    try {
      const res = await apiFetch(`/textRag/documents/${docId}/process`, {
        method: "POST",
      });
      const json = (await res.json()) as { code?: number; message?: string };
      if (json.code !== 200) {
        setActionError(json.message ?? "重新处理失败");
        await loadDocuments();
        return;
      }
      setListRefreshHint(
        "重新处理已提交，请点击上方「刷新」按钮重新获取文档列表状态。",
      );
    } catch {
      setActionError("网络错误，请稍后重试");
      await loadDocuments();
    }
  }

  async function onViewChunks(docId: string, fileName: string) {
    setActionError(null);
    setChunksDoc({ id: docId, fileName });
    setChunks([]);
    setChunksOpen(true);
    setChunksLoading(true);
    try {
      const res = await apiFetch(`/textRag/documents/${docId}/chunks`, {
        method: "GET",
      });
      const json = (await res.json()) as {
        code?: number;
        data?: DocumentChunkRow[];
        message?: string;
      };
      if (json.code === 200 && Array.isArray(json.data)) {
        setChunks(json.data);
      } else {
        setChunks([]);
        setActionError(json.message ?? "获取分块失败");
      }
    } catch {
      setChunks([]);
      setActionError("网络错误，无法加载分块");
    } finally {
      setChunksLoading(false);
    }
  }

  function onChunksOpenChange(open: boolean) {
    setChunksOpen(open);
    if (!open) {
      setChunksDoc(null);
      setChunks([]);
    }
  }

  function onRequestDeleteDocument(docId: string, fileName: string) {
    setDeleteTarget({ id: docId, fileName });
  }

  async function onConfirmDeleteDocument() {
    if (!knowledgeId || !deleteTarget) return;
    const docId = deleteTarget.id;
    setDeleteTarget(null);

    setActionError(null);
    setDeletingId(docId);
    try {
      const res = await apiFetch(`/textRag/documents/delete/${docId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { code?: number; message?: string };
      if (json.code !== 200) {
        setActionError(json.message ?? "删除失败");
        return;
      }
      await loadDocuments();
    } catch {
      setActionError("网络错误，删除失败");
    } finally {
      setDeletingId(null);
    }
  }

  if (!knowledgeId) {
    return (
      <div className="dream-grain relative">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 text-sm text-neutral-500">无效的知识库</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dream-grain relative">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* 面包屑 */}
        <div className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/textrag">首页</Link>
          <span>/</span>
          <Link href="/textrag/knowledge" className="hover:underline">
            知识库
          </Link>
          <span>/</span>
          <span className="text-neutral-700">{`${knowledgeName || ""}`}</span>
        </div>

        {/* 标题行 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-[var(--dream-ink)]">
              文档管理
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              在知识库详情页面上传文档，系统会自动解析、分块和向量化
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*,.txt,.md"
              multiple
              onChange={onPickFile}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl"
              disabled={refreshing || loading}
              onClick={() => {
                void handleRefreshDocuments();
              }}
            >
              {refreshing ? (
                <Loader2
                  className="animate-spin"
                  data-icon="inline-start"
                  aria-hidden
                />
              ) : (
                <RefreshCw data-icon="inline-start" aria-hidden />
              )}
              刷新
            </Button>

            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 rounded-xl"
            >
              <FileUp data-icon="inline-start" aria-hidden />
              上传文档
            </Button>
          </div>
        </div>

        <Separator className="mb-4" />

        {actionError || listRefreshHint ? (
          <div className="mb-4 flex flex-col gap-3">
            {actionError ? (
              <Alert
                variant="destructive"
                className="rounded-xl border border-red-200/80 bg-red-50/90"
              >
                <AlertDescription className="text-sm text-red-800">
                  {actionError}
                </AlertDescription>
              </Alert>
            ) : null}
            {listRefreshHint ? (
              <Alert
                variant="default"
                className="rounded-xl border border-sky-200/80 bg-sky-50/80"
              >
                <Info aria-hidden />
                <AlertDescription className="text-sm text-sky-900">
                  {listRefreshHint}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}

        {/* 内容 */}
        <Card className="border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/75 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[var(--dream-ink)]">
              文档列表
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  正在加载...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/50 p-4 text-sm text-neutral-600">
                  暂无文档，请点击右上角上传文档。
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>文档名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>块数</TableHead>
                      <TableHead>文件大小</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="max-w-[18rem]">
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText
                              className="size-4 shrink-0 text-blue-600"
                              strokeWidth={2}
                              aria-hidden
                            />
                            <span className="truncate" title={d.fileName}>
                              {d.fileName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeClass[d.status]}
                          >
                            {d.status === "pending"
                              ? "待处理"
                              : d.status === "processing"
                                ? "处理中"
                                : d.status === "failed"
                                  ? "失败"
                                  : "已完成"}
                          </Badge>
                        </TableCell>
                        <TableCell>{d.chunkCount}</TableCell>
                        <TableCell>{formatBytes(d.fileSize)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {d.status === "done" ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-xl border-0 bg-sky-500 text-white shadow-sm hover:bg-sky-600"
                                  onClick={() =>
                                    onViewChunks(d.id, d.fileName)
                                  }
                                >
                                  <LayoutList
                                    data-icon="inline-start"
                                    aria-hidden
                                  />
                                  查看分块
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="rounded-xl border-0 bg-amber-500 text-white shadow-sm hover:bg-amber-600"
                                  onClick={() => onReprocessDocument(d.id)}
                                >
                                  <RefreshCw
                                    data-icon="inline-start"
                                    aria-hidden
                                  />
                                  重新处理
                                </Button>
                              </>
                            ) : null}
                            {d.status === "pending" || d.status === "failed" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-xl border-0 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                                onClick={() => onProcessDocument(d.id)}
                              >
                                <Play data-icon="inline-start" aria-hidden />
                                处理
                              </Button>
                            ) : null}
                            {d.status === "processing" ? (
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-xl border-0 bg-blue-600 text-white opacity-70"
                                disabled
                              >
                                <Loader2
                                  className="size-4 animate-spin"
                                  aria-hidden
                                />
                                处理中
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="rounded-xl"
                              disabled={deletingId === d.id}
                              onClick={() =>
                                onRequestDeleteDocument(d.id, d.fileName)
                              }
                            >
                              {deletingId === d.id ? (
                                <Loader2
                                  className="size-4 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <Trash2 data-icon="inline-start" aria-hidden />
                              )}
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <DocumentChunksDialog
          open={chunksOpen}
          onOpenChange={onChunksOpenChange}
          fileName={chunksDoc?.fileName ?? ""}
          loading={chunksLoading}
          chunks={chunks}
        />

        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <Trash2 aria-hidden />
              </AlertDialogMedia>
              <AlertDialogTitle>删除文档</AlertDialogTitle>
              <AlertDialogDescription>
                确定删除文档「{deleteTarget?.fileName ?? ""}」？此操作不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">取消</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                variant="destructive"
                onClick={() => {
                  void onConfirmDeleteDocument();
                }}
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
