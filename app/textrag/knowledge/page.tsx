"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Info,
  LogIn,
  Search,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import CreateKnowledgeDialog, {
  CreateKnowledgePayload,
} from "./_components/create-knowledge-dialog";

import { apiFetch } from "@/lib/auth";

type KnowledgeItem = {
  id?: string;
  user_id?: string;
  name: string;
  description: string;
  /** 列表接口可为 data:image/...;base64,...，便于直接作为 img src */
  cover_image?: string;
  chunk_size: number;
  chunk_overlap: number;
  created_at?: number;
  updated_at?: number;
};

function kbCoverDisplaySrc(cover?: string | null): string | undefined {
  if (!cover?.trim()) return undefined;
  if (cover.startsWith("data:image/")) return cover;
  if (cover.startsWith("http://") || cover.startsWith("https://")) return cover;
  return undefined;
}

type KnowledgeListResponse = {
    items: KnowledgeItem[];
    total: number;
    page: number;
    page_size: number;
};

type SortField = "updatedAt" | "createdAt" | "name";
type SortDir = "desc" | "asc";

const SORT_FIELD_LABEL: Record<SortField, string> = {
  createdAt: "创建时间",
  updatedAt: "更新时间",
  name: "名称",
};

const SORT_DIR_LABEL: Record<SortDir, string> = {
  desc: "降序",
  asc: "升序",
};

export default function KnowledgePage() {
  const router = useRouter();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  // const [loading, setLoading] = useState(true);

  // 搜索：输入框与已应用查询分离，模拟“搜索”按钮行为
  const [searchDraft, setSearchDraft] = useState("");

  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<KnowledgeItem | null>(null);
  const fetchItems = async (search: string='', sortField: SortField='createdAt', sortDir: SortDir='desc')=>{
    const abortController = new AbortController();
    const res = await apiFetch(`/textRag/kb/list?search=${search}&sort_by=${sortField}&sort_order=${sortDir}`, {
      method: 'GET',
      signal: abortController.signal,
    });
    const resData = (await res.json()) as {
      code?: number;
      message?: string;
      data?: KnowledgeListResponse;
    };
    if (resData.code === 200 && resData.data) {
      setItems(resData.data?.items || []);
    }
    return () => {
      abortController.abort(); // 取消请求
    };
  }
  const handleSearch = async ()=>{
    console.log("searchDraft", searchDraft);
    console.log("sortField", sortField);
    console.log("sortDir", sortDir);
    debugger
    await fetchItems(searchDraft.trim(), sortField, sortDir);
  }
  useEffect(() => {
    
    let abort: ()=>void;
    const fetchData = async () => {
      abort = await fetchItems();
    }

    fetchData()
  
    return () => {
      abort?.(); // 取消请求
    };

  }, []);


  function openCreate() {
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
  }

  async function onCreate(payload: CreateKnowledgePayload) {
    const name = payload.name.trim();
    if (!name) return;
    const fd = new FormData();
    fd.append("name", name);
    fd.append("description", payload.description.trim());
    fd.append("chunk_size", String(payload.chunk_size));
    fd.append("chunk_overlap", String(payload.chunk_overlap));
    if (payload.coverFile) {
      fd.append("cover_image", payload.coverFile);
    }
    await apiFetch("/textRag/kb/create", {
      method: "POST",
      body: fd,
    });
    await fetchItems();
    closeCreate();
  }

  async function onDelete(id: string) {
    // setItems((prev) => prev.filter((it) => it.id !== id));
    const res = await apiFetch(`/textRag/kb/delete/${id}`, {
      method: 'DELETE',
    });
    const resData = (await res.json()) as {
      code?: number;
      message?: string;
    };
    if (resData.code === 200) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    }
  }

  function openEdit(target: KnowledgeItem) {
    setEditTarget(target);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditTarget(null);
  }

  async function onEdit(id: string, payload: CreateKnowledgePayload) {
    const fd = new FormData();
    fd.append("name", payload.name.trim());
    fd.append("description", payload.description.trim());
    fd.append("chunk_size", String(payload.chunk_size));
    fd.append("chunk_overlap", String(payload.chunk_overlap));
    if (payload.coverFile) {
      fd.append("cover_image", payload.coverFile);
    }
    if (payload.removeCover) {
      fd.append("delete_cover", "true");
    }
    await apiFetch(`/textRag/kb/update/${id}`, {
      method: "PUT",
      body: fd,
    });
    await fetchItems();
    closeEdit();
  }

  return (
    <div className="dream-grain relative ">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* 面包屑 */}
        <div className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/textrag" className="hover:underline">
            首页
          </Link>
          <span>/</span>
          <span className="text-neutral-700">知识库管理</span>
        </div>

        {/* 标题行 */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white ring-1 ring-black/5">
              <FolderOpen className="size-5 text-sky-600" strokeWidth={1.75} />
            </span>
            <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-[var(--dream-ink)]">
              知识库管理
            </h1>
          </div>

          <Button
            onClick={openCreate}
            className="h-10 rounded-xl bg-blue-600 px-4 text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 size-4" aria-hidden />
            创建知识库
          </Button>
        </div>

        {/* 筛选条 */}
        <div className="mb-4 rounded-2xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/70 p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.9fr_0.8fr_auto] md:items-end">
            <div className="flex flex-col gap-1">
              <label className="sr-only">搜索</label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden
                />
                <Input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="搜索知识库名称或描述..."
                  className="h-10 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/90 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-[color-mix(in_oklch,var(--dream-teal)_45%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                排序字段
              </label>
              <Select
                value={sortField}
                onValueChange={(v) => {
                  if (v === "createdAt" || v === "updatedAt" || v === "name") {
                    setSortField(v);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/90 px-3 text-sm outline-none transition focus:border-[color-mix(in_oklch,var(--dream-teal)_45%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)]">
                  <SelectValue>
                    {(v) =>
                      v != null && SORT_FIELD_LABEL[v as SortField]
                        ? SORT_FIELD_LABEL[v as SortField]
                        : SORT_FIELD_LABEL.createdAt
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectGroup>
                    <SelectItem value="createdAt">创建时间</SelectItem>
                    <SelectItem value="updatedAt">更新时间</SelectItem>
                    <SelectItem value="name">名称</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-600">
                排序方向
              </label>
              <Select
                value={sortDir}
                onValueChange={(v) => {
                  if (v === "asc" || v === "desc") {
                    setSortDir(v);
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border border-[color-mix(in_oklch,var(--dream-ink)_10%,transparent)] bg-white/90 px-3 text-sm outline-none transition focus:border-[color-mix(in_oklch,var(--dream-teal)_45%,transparent)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)]">
                  <SelectValue>
                    {(v) =>
                      v != null && SORT_DIR_LABEL[v as SortDir]
                        ? SORT_DIR_LABEL[v as SortDir]
                        : SORT_DIR_LABEL.desc
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectGroup>
                    <SelectItem value="desc">降序</SelectItem>
                    <SelectItem value="asc">升序</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => handleSearch()}
                className="h-10 rounded-xl bg-blue-600 px-4 text-white hover:bg-blue-700"
              >
                <Search className="mr-2 size-4" aria-hidden />
                搜索
              </Button>
            </div>
          </div>
        </div>

        {/* 空状态提示 */}
        {items.length === 0 ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/90 px-4 py-3 text-sm text-sky-950 shadow-sm">
            <Info className="mt-0.5 size-5 shrink-0 text-sky-600" aria-hidden />
            <div>
              还没有知识库，点击上方按钮创建一个吧！
            </div>
          </div>
        ) : null}

        {/* 列表 */}
        { items.length > 0 ? (
          <div className="mt-6 grid max-w-5xl gap-4 md:mx-auto grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {items.map((it) => {
              const coverThumb = kbCoverDisplaySrc(it.cover_image);
              return (
              <Card key={it.id} className="overflow-hidden">
                <CardHeader className="grid place-items-center px-6 pb-3 pt-6">
                  {coverThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverThumb}
                      alt=""
                      className="h-24 w-full max-w-[220px] rounded-xl object-cover ring-1 ring-black/10"
                    />
                  ) : (
                    <span className="flex size-11 items-center justify-center rounded-xl bg-muted ring-1 ring-foreground/10">
                      <FolderOpen aria-hidden size={20} strokeWidth={1.75} />
                    </span>
                  )}
                </CardHeader>

                <CardContent className="px-6 pb-4">
                  <CardTitle className="flex items-center gap-2 p-0 text-base">
                    <FolderOpen aria-hidden size={16} strokeWidth={1.75} />
                    <span className="truncate">{it.name}</span>
                  </CardTitle>
                </CardContent>

                <CardFooter className="gap-3 border-t-0 bg-transparent px-6 py-4">
                  <Button
                    size="lg"
                    className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      router.push(`/textrag/knowledge/${it.id}`);
                    }}
                  >
                    <LogIn data-icon="inline-start" aria-hidden />
                    进入
                  </Button>

                  <Button
                    size="lg"
                    variant="secondary"
                    className="flex-1 rounded-xl bg-yellow-500 text-black hover:bg-yellow-600"
                    onClick={() => openEdit(it)}
                  >
                    <Pencil data-icon="inline-start" aria-hidden />
                    编辑
                  </Button>

                  <Button
                    size="lg"
                    variant="destructive"
                    className="flex-1 rounded-xl bg-red-500 text-white hover:bg-red-600"
                    onClick={() => onDelete(it.id!)}
                  >
                    <Trash2 data-icon="inline-start" aria-hidden />
                    删除
                  </Button>
                </CardFooter>
              </Card>
            );
            })}
          </div>
        ) : null}

        {/* 创建弹窗 */}
        <CreateKnowledgeDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          onCreate={onCreate}
        />

        {/* 编辑弹窗（复用创建弹框表单） */}
        <CreateKnowledgeDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditTarget(null);
          }}
          mode="edit"
          knowledge={editTarget}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}
