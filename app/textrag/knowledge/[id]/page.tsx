"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileUp, Loader2, Trash2, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

type KnowledgeItem = {
  id: string;
  name: string;
  description?: string;
  coverFileName?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  docCount: number;
  createdAt: number;
  updatedAt: number;
};

type DocumentStatus = "pending" | "processing" | "done";

type KnowledgeDocument = {
  id: string;
  knowledgeId: string;
  fileName: string;
  status: DocumentStatus;
  chunkCount: number;
  fileSize: number;
  createdAt: number;
  updatedAt: number;
};

type DocumentStore = Record<string, KnowledgeDocument[]>;

const KNOWLEDGE_KEY = "textrag_knowledge_items";
const DOCS_KEY = "textrag_knowledge_documents";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
  const knowledgeId = params.id;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [knowledge, setKnowledge] = useState<KnowledgeItem | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!knowledgeId) return;

    setLoading(true);
    try {
      const rawKnowledge = localStorage.getItem(KNOWLEDGE_KEY);
      const list = rawKnowledge
        ? (JSON.parse(rawKnowledge) as KnowledgeItem[])
        : [];
      const found = Array.isArray(list)
        ? list.find((x) => x.id === knowledgeId) ?? null
        : null;
      setKnowledge(found);

      const rawDocs = localStorage.getItem(DOCS_KEY);
      const parsed: unknown = rawDocs ? JSON.parse(rawDocs) : {};
      const docStore: DocumentStore =
        parsed && typeof parsed === "object" ? (parsed as DocumentStore) : {};
      const perKnowledge = docStore[knowledgeId] ?? [];
      setDocuments(Array.isArray(perKnowledge) ? perKnowledge : []);
    } catch {
      setKnowledge(null);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [knowledgeId]);

  const statusBadgeVariant = useMemo(() => {
    const map: Record<DocumentStatus, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "default",
      done: "default",
    };
    return map;
  }, []);

  function persistDocuments(next: KnowledgeDocument[]) {
    setDocuments(next);

    const rawDocs = localStorage.getItem(DOCS_KEY);
    const parsed: unknown = rawDocs ? JSON.parse(rawDocs) : {};
    const nextMap: DocumentStore =
      parsed && typeof parsed === "object" ? { ...(parsed as DocumentStore) } : {};
    nextMap[knowledgeId] = next;
    localStorage.setItem(DOCS_KEY, JSON.stringify(nextMap));

    // 同步更新知识库 docCount（保证回到列表页数量正确）
    if (knowledgeId) {
      const rawKnowledge = localStorage.getItem(KNOWLEDGE_KEY);
      const list = rawKnowledge ? (JSON.parse(rawKnowledge) as KnowledgeItem[]) : [];
      if (Array.isArray(list)) {
        const now = Date.now();
        const nextKnowledge = list.map((it) => {
          if (it.id !== knowledgeId) return it;
          return { ...it, docCount: next.length, updatedAt: now };
        });
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(nextKnowledge));
        setKnowledge((prev) => {
          if (!prev) return prev;
          return { ...prev, docCount: next.length, updatedAt: now };
        });
      }
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!knowledgeId || files.length === 0) return;

    const now = Date.now();
    const next: KnowledgeDocument[] = files.map((f) => ({
      id: uid(),
      knowledgeId,
      fileName: f.name,
      status: "pending",
      chunkCount: 0,
      fileSize: f.size,
      createdAt: now,
      updatedAt: now,
    }));

    persistDocuments([...documents, ...next]);

    // 允许连续上传同名文件
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onProcessDocument(docId: string) {
    if (!knowledgeId) return;

    const now = Date.now();
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    if (doc.status !== "pending") return;

    const processingNext: KnowledgeDocument[] = documents.map(
      (d): KnowledgeDocument =>
        d.id === docId ? { ...d, status: "processing", updatedAt: now } : d
    );
    persistDocuments(processingNext);

    // 模拟“解析/分块/向量化”
    window.setTimeout(() => {
      const doneNext: KnowledgeDocument[] = processingNext.map(
        (d): KnowledgeDocument => {
        if (d.id !== docId) return d;
        const estimatedChunks = Math.max(
          1,
          Math.round(d.fileSize / 1024 / 3)
        );
        return {
          ...d,
          status: "done",
          chunkCount: estimatedChunks,
          updatedAt: Date.now(),
        };
      });
      persistDocuments(doneNext);
    }, 1200);
  }

  function onDeleteDocument(docId: string) {
    const next = documents.filter((d) => d.id !== docId);
    persistDocuments(next);
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
          <span className="text-neutral-700">
            {knowledge?.name ?? `知识库${knowledgeId}`}
          </span>
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
              onClick={() => fileInputRef.current?.click()}
              className="h-10 rounded-xl"
            >
              <FileUp data-icon="inline-start" aria-hidden />
              上传文档
            </Button>
          </div>
        </div>

        <Separator className="mb-4" />

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
                      <TableHead>文件名称</TableHead>
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
                          <span className="block truncate">{d.fileName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[d.status]}>
                            {d.status === "pending"
                              ? "待处理"
                              : d.status === "processing"
                                ? "处理中"
                                : "已处理"}
                          </Badge>
                        </TableCell>
                        <TableCell>{d.chunkCount}</TableCell>
                        <TableCell>{formatBytes(d.fileSize)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="rounded-xl"
                              disabled={d.status !== "pending"}
                              onClick={() => onProcessDocument(d.id)}
                            >
                              {d.status === "processing" ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                              ) : (
                                <Wand2 data-icon="inline-start" aria-hidden />
                              )}
                              处理
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="rounded-xl"
                              onClick={() => onDeleteDocument(d.id)}
                            >
                              <Trash2 data-icon="inline-start" aria-hidden />
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
      </div>
    </div>
  );
}

