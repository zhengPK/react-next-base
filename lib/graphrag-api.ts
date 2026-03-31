/**
 * graph-backend FastAPI（默认 main.py: http://127.0.0.1:5001）
 * 可通过环境变量 NEXT_PUBLIC_GRAPHRAG_API_URL 覆盖。
 */

export function getGraphRagApiBaseUrl(): string {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_GRAPHRAG_API_URL
      : undefined;
  const base = (raw && raw.trim()) || "http://81.70.184.14:5001";
  return base.replace(/\/$/, "");
}

function graphRagUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getGraphRagApiBaseUrl()}${p}`;
}

async function readErrorDetail(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown };
    const d = data?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((item) =>
          typeof item === "object" && item !== null && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : JSON.stringify(item)
        )
        .join("；");
    }
    if (d != null) return String(d);
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export type GraphRagImportStats = Record<string, unknown>;

export type GraphRagImportResponse = {
  success: boolean;
  message: string;
  stats: GraphRagImportStats;
};

export async function graphRagImportCsv(
  file: File,
  clearExisting: boolean
): Promise<GraphRagImportResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("clear_existing", clearExisting ? "true" : "false");
  const res = await fetch(graphRagUrl("/api/graphrag/import/csv"), {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await readErrorDetail(res));
  return res.json() as Promise<GraphRagImportResponse>;
}

export type GraphRagEmbeddingStats = Record<string, unknown>;

export type GraphRagEmbeddingRefreshResponse = {
  success: boolean;
  message: string;
  stats: GraphRagEmbeddingStats;
};

export async function graphRagRefreshEmbeddings(): Promise<GraphRagEmbeddingRefreshResponse> {
  const res = await fetch(graphRagUrl("/api/graphrag/embeddings/refresh"), {
    method: "POST",
  });
  if (!res.ok) throw new Error(await readErrorDetail(res));
  return res.json() as Promise<GraphRagEmbeddingRefreshResponse>;
}

export type GraphRagQaProvider = "volcengine" | "deepseek";

export type GraphRagQaRequestBody = {
  question: string;
  query_type: "book" | "author";
  top_k: number;
  temperature: number;
  provider: GraphRagQaProvider;
  api_key?: string | null;
  model?: string | null;
};

export type GraphRagQaSource = Record<string, unknown>;

export type GraphRagQaResponse = {
  answer: string;
  query_type: string;
  sources: GraphRagQaSource[];
};

export async function graphRagQa(
  body: GraphRagQaRequestBody
): Promise<GraphRagQaResponse> {
  const payload: GraphRagQaRequestBody = {
    ...body,
    api_key: body.api_key?.trim() ? body.api_key.trim() : null,
    model: body.model?.trim() ? body.model.trim() : null,
  };
  const res = await fetch(graphRagUrl("/api/graphrag/qa"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorDetail(res));
  return res.json() as Promise<GraphRagQaResponse>;
}
