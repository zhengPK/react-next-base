"use client";

import { SubmitEvent, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CreateKnowledgePayload = {
  name: string;
  description: string;
  cover_image?: string;
  chunk_size: number;
  chunk_overlap: number;
};


type KnowledgeItem = {
  id?: string;
  user_id?: string;
  name: string;
  description: string;
  cover_image?:string;
  chunk_size: number;
  chunk_overlap: number;
  created_at?: number;
  updated_at?: number;
 
};
type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  mode: "create" | "edit";
  knowledge?: KnowledgeItem | null;

  onCreate?: (payload: CreateKnowledgePayload) => void;
  onEdit?: (id: string, payload: CreateKnowledgePayload) => void;
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

function normalizeNumber(value: string) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return n;
}

export default function CreateKnowledgeDialog({
  open,
  onOpenChange,
  mode,
  knowledge,
  onCreate,
  onEdit,
}: Props) {
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover_image, setcover_image] = useState<string | undefined>(
    undefined
  );
  const [chunk_size, setchunk_size] = useState(512);
  const [chunk_overlap, setchunk_overlap] = useState(50);
  const [fileError, setFileError] = useState<string | null>(null);

  const canCreate = useMemo(() => {
    return name.trim().length >= 1 && !fileError;
  }, [fileError, name]);

  useEffect(() => {
    if (!open) return;

    const t = window.setTimeout(() => {
      if (mode === "edit" && knowledge) {
        setName(knowledge.name ?? "");
        setDescription(knowledge.description ?? "");
        setcover_image(knowledge.cover_image);
        setchunk_size(knowledge.chunk_size ?? 512);
        setchunk_overlap(knowledge.chunk_overlap ?? 50);
      } else {
        setName("");
        setDescription("");
        setcover_image(undefined);
        setchunk_size(512);
        setchunk_overlap(50);
      }
      setFileError(null);
      firstInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(t);
  }, [open, mode, knowledge]);

  function close() {
    onOpenChange(false);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setcover_image(undefined);
      setFileError(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError("封面图片格式不正确，仅支持 JPG/PNG/GIF/WEBP");
      setcover_image(undefined);
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (f.size > maxBytes) {
      setFileError("封面图片大小超过 5MB");
      setcover_image(undefined);
      return;
    }

    setFileError(null);
    setcover_image(f.name);
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!canCreate) return;

    const payload: CreateKnowledgePayload = {
      name: name.trim(),
      description: description.trim(),
      cover_image,
      chunk_size,
      chunk_overlap,
    };

    if (mode === "edit") {
      const id = knowledge?.id;
      if (!id || !onEdit) return;
      onEdit(id, payload);
      return;
    }

    if (!onCreate) return;
    onCreate(payload);
  }

  if (!open) return null;

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
        aria-labelledby={
          mode === "edit" ? "edit-knowledge-title" : "create-knowledge-title"
        }
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white/95 p-0 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-[#1a6b4a] via-[#145238] to-[#0b2e1f] px-6 py-4">
          <h2
            id={mode === "edit" ? "edit-knowledge-title" : "create-knowledge-title"}
            className="font-[family-name:var(--font-syne)] text-lg font-bold text-white"
          >
            {mode === "edit" ? "编辑知识库" : "创建知识库"}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={close}
            className="rounded-xl text-white/90 hover:bg-white/10 hover:text-white"
            aria-label="关闭"
          >
            <X aria-hidden />
          </Button>
        </div>

        <form onSubmit={submit} className="p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-[var(--dream-ink)]">
                名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={firstInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="h-11 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white px-4 text-sm outline-none transition focus:border-[color-mix(in_oklch,var(--dream-teal)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-[var(--dream-ink)]">
                描述 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder=""
                className="min-h-[120px] resize-none rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[color-mix(in_oklch,var(--dream-teal)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-[var(--dream-ink)]">
                封面图片（可选）
              </Label>
              <div className="flex items-center gap-4 rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white px-4 py-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={onPickFile}
                  className="sr-only"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 rounded-xl bg-[#5a7be1] px-4 text-white shadow-sm transition hover:bg-[#4f6fdb]"
                >
                  选择文件
                </Button>
                <span className="truncate text-sm text-[color-mix(in_oklch,var(--dream-ink)_60%,transparent)]">
                  {cover_image ?? "未选择文件"}
                </span>
              </div>
              <p className="text-xs text-[color-mix(in_oklch,var(--dream-ink)_55%,transparent)]">
                支持 JPG, PNG, GIF, WEBP 格式，最大 5MB
              </p>
              {fileError ? (
                <Alert
                  variant="destructive"
                  className="rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2.5"
                >
                  <AlertDescription className="text-xs font-medium text-red-600">
                    {fileError}
                  </AlertDescription>
                </Alert>
              ) : null}

              {cover_image ? (
                <p className="text-xs text-[color-mix(in_oklch,var(--dream-ink)_60%,transparent)]">
                  已选择：{cover_image}
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-[var(--dream-ink)]">
                  分块大小
                </Label>
                <Input
                  inputMode="numeric"
                  value={String(chunk_size)}
                  onChange={(e) => setchunk_size(normalizeNumber(e.target.value))}
                  className="h-11 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white px-4 text-sm outline-none transition focus:border-[color-mix(in_oklch,var(--dream-teal)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)]"
                />
                <p className="text-xs text-[color-mix(in_oklch,var(--dream-ink)_52%,transparent)]">
                  每个文本块的最大字符数，建议 512-1024
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-[var(--dream-ink)]">
                  分块重叠
                </Label>
                <Input
                  inputMode="numeric"
                  value={String(chunk_overlap)}
                  onChange={(e) =>
                    setchunk_overlap(normalizeNumber(e.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white px-4 text-sm outline-none transition focus:border-[color-mix(in_oklch,var(--dream-teal)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)]"
                />
                <p className="text-xs text-[color-mix(in_oklch,var(--dream-ink)_52%,transparent)]">
                  相邻块之间的重叠字符数，建议 50-100
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={close}
                className="h-10 rounded-xl bg-neutral-600 px-5 text-white hover:bg-neutral-700"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!canCreate || !name.trim()}
                className="h-10 rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {mode === "edit" ? "保存" : "创建"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

