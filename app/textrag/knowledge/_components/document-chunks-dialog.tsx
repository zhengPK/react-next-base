"use client";

import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export type DocumentChunkRow = {
  id: string;
  content: string;
  chunk_index: number;
  metadata?: Record<string, unknown>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  loading: boolean;
  chunks: DocumentChunkRow[];
};

export function DocumentChunksDialog({
  open,
  onOpenChange,
  fileName,
  loading,
  chunks,
}: Props) {
  if (!open) return null;

  function close() {
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-chunks-title"
        className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl backdrop-blur-md"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200/80 bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-3.5">
          <h2
            id="document-chunks-title"
            className="min-w-0 truncate font-[family-name:var(--font-syne)] text-base font-bold text-white"
          >
            文档分块 · {fileName}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={close}
            className="shrink-0 rounded-xl text-white/90 hover:bg-white/15 hover:text-white"
            aria-label="关闭"
          >
            <X aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-600">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              正在加载分块…
            </div>
          ) : chunks.length === 0 ? (
            <p className="py-12 text-center text-sm text-neutral-500">
              暂无分块数据（可能尚未向量化或检索异常）。
            </p>
          ) : (
            <ul className="space-y-3">
              {chunks.map((c, i) => (
                <li
                  key={c.id || `${c.chunk_index}-${i}`}
                  className="rounded-xl border border-neutral-200/90 bg-neutral-50/80 p-3.5 shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-sky-700">
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-sky-800">
                      块 #{c.chunk_index}
                    </span>
                    {c.id ? (
                      <span className="truncate text-neutral-500" title={c.id}>
                        {c.id}
                      </span>
                    ) : null}
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-neutral-800">
                    {c.content}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
