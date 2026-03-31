"use client";

import { useId, useState } from "react";
import { ArrowUp, CircleHelp, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = { id: string; role: ChatRole; content: string };

const sliderCopper =
  "[&_[data-slot=slider-range]]:bg-[var(--dream-copper)] [&_[data-slot=slider-thumb]]:border-[var(--dream-copper)] [&_[data-slot=slider-thumb]]:ring-[color-mix(in_oklch,var(--dream-copper)_35%,transparent)]";

/** 与默认 `RadioGroupItem` 的 `data-checked:bg-primary` 区分开：透明底 + 铜色环 + 铜色内点，避免选中后整块实心/指示器颜色打架 */
const radioCopper = cn(
  "border-[color-mix(in_oklch,var(--dream-copper)_38%,transparent)] bg-background shadow-none",
  "dark:border-input dark:bg-input/30",
  "data-checked:border-[var(--dream-copper)] data-checked:bg-transparent dark:data-checked:bg-transparent",
  "data-checked:text-[var(--dream-copper)]",
  "data-checked:[&_[data-slot=radio-group-indicator]_span]:bg-[var(--dream-copper)]",
  "data-checked:[&_[data-slot=radio-group-indicator]_span]:opacity-100"
);

export function GraphRagQaView() {
  const apiKeyId = useId();
  const modelId = useId();

  const [queryType, setQueryType] = useState("book");
  const [topK, setTopK] = useState(3);
  const [temperature, setTemperature] = useState(0.3);
  const [provider, setProvider] = useState("volcengine");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [modelName, setModelName] = useState("doubao-seed-1-6-250615");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
      },
    ]);
    setDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside
        className="flex max-h-[min(100vh,720px)] w-full shrink-0 flex-col gap-6 overflow-y-auto border-border bg-[color-mix(in_oklch,var(--dream-ink)_2%,var(--background))] p-4 lg:max-h-none lg:w-80 lg:border-r"
        aria-label="参数与历史"
      >
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground">
            参数设置
          </p>
          <form
            className="contents"
            noValidate
            aria-label="问答参数设置"
            onSubmit={(e) => e.preventDefault()}
          >
          <FieldGroup className="gap-6">
            <FieldSet className="min-w-0 border-0 p-0">
              <FieldLegend variant="label" className="mb-3">
                选择查询类型
              </FieldLegend>
              <RadioGroup
                value={queryType}
                onValueChange={setQueryType}
                className="!flex w-full min-w-0 flex-row flex-wrap gap-x-6 gap-y-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="book"
                    id="graphrag-query-book"
                    className={radioCopper}
                  />
                  <Label
                    htmlFor="graphrag-query-book"
                    className={cn(
                      "cursor-pointer font-normal text-muted-foreground transition-colors",
                      queryType === "book" &&
                        "font-medium text-[var(--dream-copper)]"
                    )}
                  >
                    图书
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="author"
                    id="graphrag-query-author"
                    className={radioCopper}
                  />
                  <Label
                    htmlFor="graphrag-query-author"
                    className={cn(
                      "cursor-pointer font-normal text-muted-foreground transition-colors",
                      queryType === "author" &&
                        "font-medium text-[var(--dream-copper)]"
                    )}
                  >
                    作者
                  </Label>
                </div>
              </RadioGroup>
            </FieldSet>

            <Separator className="bg-border" />

            <Field>
              <div className="flex w-full items-end justify-between gap-3">
                <FieldLabel className="text-muted-foreground">
                  返回结果数量（Top K）
                </FieldLabel>
                <span className="text-sm font-semibold tabular-nums text-[var(--dream-copper)]">
                  {topK}
                </span>
              </div>
              <Slider
                value={[topK]}
                onValueChange={(v) => {
                  const next = Array.isArray(v) ? v[0] : v;
                  setTopK(typeof next === "number" ? next : 3);
                }}
                min={1}
                max={20}
                step={1}
                className={cn("mt-3 w-full", sliderCopper)}
              />
            </Field>

            <Field>
              <div className="flex w-full items-end justify-between gap-3">
                <FieldLabel className="text-muted-foreground">温度</FieldLabel>
                <span className="text-sm font-semibold tabular-nums text-[var(--dream-copper)]">
                  {temperature.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={(v) => {
                  const next = Array.isArray(v) ? v[0] : v;
                  setTemperature(typeof next === "number" ? next : 0);
                }}
                min={0}
                max={2}
                step={0.01}
                className={cn("mt-3 w-full", sliderCopper)}
              />
            </Field>

            <Field>
              <FieldLabel className="text-muted-foreground">
                选择大模型服务商
              </FieldLabel>
              <Select
                value={provider}
                onValueChange={(v) => setProvider(v ?? "volcengine")}
              >
                <SelectTrigger size="sm" className="mt-2 w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="volcengine">volcengine</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <div className="flex w-full items-center gap-1">
                <FieldLabel htmlFor={apiKeyId} className="flex-1">
                  火山引擎 API KEY
                </FieldLabel>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 shrink-0 text-muted-foreground"
                        aria-label="API Key 说明"
                      />
                    }
                  >
                    <CircleHelp />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    在火山引擎控制台创建 API Key，仅保存在本机浏览器会话中（示例占位，可接后端保管）。
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="relative mt-2">
                <Input
                  id={apiKeyId}
                  name="volcengine_api_key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入 API Key"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground"
                  aria-pressed={showApiKey}
                  aria-label={showApiKey ? "隐藏密钥" : "显示密钥"}
                  onClick={() => setShowApiKey((s) => !s)}
                >
                  {showApiKey ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                </Button>
              </div>
            </Field>

            <Field>
              <div className="flex w-full items-center gap-1">
                <FieldLabel htmlFor={modelId} className="flex-1">
                  火山引擎模型名称
                </FieldLabel>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 shrink-0 text-muted-foreground"
                        aria-label="模型名称说明"
                      />
                    }
                  >
                    <CircleHelp />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    与火山引擎控制台中可用的推理端点模型 ID 保持一致。
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id={modelId}
                className="mt-2"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="模型名称"
                autoComplete="off"
              />
            </Field>
          </FieldGroup>
          </form>
        </div>

        <Card
          size="sm"
          className="border-[color-mix(in_oklch,var(--dream-teal)_18%,transparent)] bg-[color-mix(in_oklch,var(--dream-teal)_8%,var(--card))]"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--dream-ink)]">
              历史查询
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Empty className="min-h-[100px] rounded-lg border border-dashed border-[color-mix(in_oklch,var(--dream-teal)_20%,transparent)] bg-[color-mix(in_oklch,var(--dream-teal)_4%,transparent)]">
              <EmptyHeader>
                <EmptyTitle className="text-muted-foreground">
                  暂无历史查询记录
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <h1 className="px-4 pt-6 text-center font-[family-name:var(--font-syne)] text-2xl font-extrabold tracking-tight text-[var(--dream-teal)] sm:text-3xl">
          图书知识图谱查询系统
        </h1>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 ? (
            <p className="mx-auto max-w-md text-center text-sm text-muted-foreground">
              在下方输入图书相关问题，发送后开始对话。
            </p>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex w-full",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-muted text-foreground"
                        : "bg-[color-mix(in_oklch,var(--dream-teal)_8%,var(--background))] text-foreground ring-1 ring-[color-mix(in_oklch,var(--dream-teal)_15%,transparent)]"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-border bg-background p-4"
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="输入图书相关问题"
              className="h-11 flex-1 rounded-full border-border px-4"
              aria-label="问题输入"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0 rounded-xl bg-[var(--dream-copper)] text-white hover:bg-[var(--dream-copper-dim)] hover:text-white"
              aria-label="发送"
              disabled={!draft.trim()}
            >
              <ArrowUp data-icon="inline-start" aria-hidden />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
