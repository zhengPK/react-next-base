"use client";

import { useCallback, useId, useRef, useState } from "react";
import { CircleHelp, CloudUpload, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const MAX_BYTES = 200 * 1024 * 1024;

const CSV_COLUMNS = [
  "name 书名",
  "author 作者",
  "publisher 出版社",
  "category 类别",
  "publish_year 出版年份",
  "summary 简介",
  "keywords 关键词，用分号分隔",
] as const;

function pickCsvFileList(list: FileList | null): File | null {
  if (!list?.length) return null;
  const f = list[0];
  if (!f.name.toLowerCase().endsWith(".csv")) return null;
  return f;
}

export function GraphRagImportView() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyFile = useCallback((next: File | null) => {
    setError(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setFile(null);
      setError("文件超过 200MB 限制。");
      return;
    }
    setFile(next);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = pickCsvFileList(e.target.files);
      applyFile(picked);
      e.target.value = "";
    },
    [applyFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const picked = pickCsvFileList(e.dataTransfer.files);
      if (!picked && e.dataTransfer.files.length > 0) {
        setError("请上传 .csv 格式的文件。");
        return;
      }
      applyFile(picked);
    },
    [applyFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDragActive(false);
  }, []);

  return (
    <div className="flex min-h-full flex-col px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
      <header className="flex flex-col gap-4">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight text-[var(--dream-ink)] sm:text-4xl">
          数据导入
        </h1>
        <Separator className="bg-[color-mix(in_oklch,var(--dream-ink)_12%,transparent)]" />
      </header>

      <Tabs defaultValue="csv" className="mt-6 flex w-full flex-col gap-6">
        <TabsList
          variant="line"
          className="h-auto w-full justify-start gap-8 rounded-none border-b border-border bg-transparent p-0"
        >
          <TabsTrigger
            value="csv"
            className="rounded-none border-0 border-transparent bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground shadow-none data-active:text-[var(--dream-copper)] data-active:shadow-none after:bg-[var(--dream-copper)]"
          >
            CSV数据导入
          </TabsTrigger>
          <TabsTrigger
            value="vector"
            className="rounded-none border-0 border-transparent bg-transparent px-0 py-2 text-sm font-medium text-muted-foreground shadow-none data-active:text-[var(--dream-copper)] data-active:shadow-none after:bg-[var(--dream-copper)]"
          >
            向量初始化
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="flex flex-col gap-6 outline-none">
          <section className="flex flex-col gap-4">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold tracking-tight text-[var(--dream-ink)]">
              CSV数据导入
            </h2>
            <p className="text-sm leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_68%,transparent)] sm:text-base">
              请上传图书信息的 CSV 文件，CSV 文件应该包含以下的列：
            </p>
            <ul className="list-disc pl-6 text-sm leading-relaxed text-[color-mix(in_oklch,var(--dream-ink)_72%,transparent)] marker:text-[var(--dream-ink)] sm:text-base [&>li+li]:mt-2">
              {CSV_COLUMNS.map((col) => (
                <li key={col}>{col}</li>
              ))}
            </ul>
          </section>

          <FieldGroup className="max-w-4xl">
            <Field>
              <div className="flex w-full items-center justify-between gap-3">
                <FieldLabel
                  htmlFor={inputId}
                  className="text-sm font-medium text-[var(--dream-ink)]"
                >
                  选择CSV文件
                </FieldLabel>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 rounded-full text-muted-foreground"
                        aria-label="CSV 列说明"
                      />
                    }
                  >
                    <CircleHelp />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    首行应为表头，列名需与左侧列表一致；keywords
                    列内多个关键词请用英文分号分隔。
                  </TooltipContent>
                </Tooltip>
              </div>
              <FieldContent className="gap-3">
                <div
                  className={cn(
                    "flex w-full cursor-pointer flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6",
                    dragActive &&
                      "border-[color-mix(in_oklch,var(--dream-copper)_45%,transparent)] bg-[color-mix(in_oklch,var(--dream-copper)_6%,var(--background))]"
                  )}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <div className="flex flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-[var(--dream-copper)] ring-1 ring-border">
                      <CloudUpload aria-hidden />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-sm font-medium text-[var(--dream-ink)]">
                        将文件拖放到此处
                      </p>
                      <p className="text-xs text-muted-foreground">
                        单文件最大 200MB · CSV
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                  >
                    浏览文件
                  </Button>
                </div>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={onInputChange}
                />
                {file ? (
                  <p className="text-sm text-muted-foreground">
                    已选择：<span className="font-medium text-foreground">{file.name}</span>{" "}
                    <span className="text-muted-foreground">
                      （{(file.size / 1024).toFixed(1)} KB）
                    </span>
                  </p>
                ) : null}
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
              </FieldContent>
            </Field>
          </FieldGroup>
        </TabsContent>

        <TabsContent value="vector" className="flex flex-col outline-none">
          <div className="flex max-w-2xl flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold tracking-tight text-[var(--dream-ink)] sm:text-2xl">
                  向量初始化
                </h2>
                <a
                  href="#"
                  className="inline-flex shrink-0 rounded-md text-muted-foreground transition hover:text-foreground"
                  aria-label="向量初始化相关说明"
                >
                  <Link2 aria-hidden />
                </a>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                为数据库中的节点生成嵌入向量，此操作会为 Book 和 Author
                节点生成向量，用于后续的向量检索。
              </p>
            </div>
            <Button
              type="button"
              className="h-11 w-full border-transparent bg-[var(--dream-copper)] text-white hover:bg-[var(--dream-copper-dim)] hover:text-white"
            >
              开始生成向量
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
