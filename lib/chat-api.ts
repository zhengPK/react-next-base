import { apiFetch } from "@/lib/auth";

type ApiEnvelope<T> = { code: number; message: string; data: T };

async function readApiJson<T>(res: Response): Promise<ApiEnvelope<T>> {
  return (await res.json()) as ApiEnvelope<T>;
}

/** 后端 ChatSession.to_dict */
export type ChatSessionApi = {
  id: string;
  user_id: string;
  title: string | null;
  kb_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** 后端 ChatMessage.to_dict */
export type ChatMessageApi = {
  id: string;
  session_id: string;
  role: string;
  content: string;
  sources?: unknown;
  created_at?: string | null;
};

export type ChatSessionDetailApi = {
  session: ChatSessionApi;
  messages: ChatMessageApi[];
};

export type ChatSessionsListApi = {
  items: ChatSessionApi[];
  pagination: { total: number; page: number; page_size: number };
};

export async function createChatSession(title?: string): Promise<ChatSessionApi> {
  const res = await apiFetch("/textRag/chat/sessions", {
    method: "POST",
    body: JSON.stringify(title != null ? { title } : {}),
  });
  const json = await readApiJson<ChatSessionApi>(res);
  if (!res.ok || json.code !== 200 || json.data == null) {
    throw new Error(json.message || "创建会话失败");
  }
  return json.data;
}

export async function listChatSessions(
  page = 1,
  pageSize = 10,
): Promise<ChatSessionsListApi> {
  const q = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await apiFetch(`/textRag/chat/sessions/list?${q.toString()}`);
  const json = await readApiJson<ChatSessionsListApi>(res);
  if (!res.ok || json.code !== 200 || json.data == null) {
    throw new Error(json.message || "获取会话列表失败");
  }
  return json.data;
}

export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionDetailApi> {
  const res = await apiFetch(`/textRag/chat/sessions/${sessionId}`);
  const json = await readApiJson<ChatSessionDetailApi>(res);
  if (!res.ok || json.code !== 200 || json.data == null) {
    throw new Error(json.message || "获取会话详情失败");
  }
  return json.data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const res = await apiFetch(`/textRag/chat/sessions/${sessionId}`, {
    method: "DELETE",
  });
  const json = await readApiJson<null>(res);
  if (!res.ok || json.code !== 200) {
    throw new Error(json.message || "删除会话失败");
  }
}

export async function deleteAllChatSessions(): Promise<number> {
  const res = await apiFetch("/textRag/chat/sessions", {
    method: "DELETE",
  });
  const json = await readApiJson<{ deleted_count: number }>(res);
  if (!res.ok || json.code !== 200 || json.data == null) {
    throw new Error(json.message || "清空会话失败");
  }
  return json.data.deleted_count;
}

/** 与 rag-backend chat_service.chat_stream 一致 */
export type ChatSsePayload =
  | { type: "start"; content: string }
  | { type: "content"; content: string }
  | { type: "error"; content: string }
  | {
      type: "done";
      content: string;
      sources?: unknown;
      metadata?: unknown;
    };

export type StreamTextRagChatOptions = {
  max_tokens?: number;
  /** 后端 textRag/chat 使用的会话 id；不传时由后端新建会话（SSE 无回传 id，前端应优先显式创建会话） */
  session_id?: string;
  signal?: AbortSignal;
  onChunk?: (chunk: ChatSsePayload) => void;
  /** 仅聚合 type===content 的文本增量 */
  onContentDelta?: (delta: string) => void;
};

function parseSseDataLine(line: string): string | null {
  const prefix = "data:";
  const trimmed = line.trimStart();
  if (!trimmed.startsWith(prefix)) return null;
  return trimmed.slice(prefix.length).trim();
}

/**
 * 调用 POST /textRag/chat，按 SSE 解析流式块。
 * 成功时以 [DONE] 或 type===done 结束；HTTP 非 2xx 时解析 JSON message。
 */
export async function streamTextRagChat(
  question: string,
  options: StreamTextRagChatOptions = {},
): Promise<void> {
  const { max_tokens, session_id, signal, onChunk, onContentDelta } = options;

  const res = await apiFetch("/textRag/chat", {
    method: "POST",
    body: JSON.stringify({
      question,
      ...(max_tokens != null ? { max_tokens } : {}),
      ...(session_id ? { session_id } : {}),
    }),
    signal,
  });

  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const j = (await res.json()) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const body = res.body;
  if (!body) {
    throw new Error("响应无正文流");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      for (;;) {
        const sep = buffer.indexOf("\n\n");
        if (sep === -1) break;

        const rawEvent = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        const lines = rawEvent.split("\n");
        for (const line of lines) {
          const payload = parseSseDataLine(line);
          if (payload == null) continue;

          if (payload === "[DONE]") {
            return;
          }

          let parsed: ChatSsePayload;
          try {
            parsed = JSON.parse(payload) as ChatSsePayload;
          } catch {
            continue;
          }

          onChunk?.(parsed);

          if (parsed.type === "content" && parsed.content) {
            onContentDelta?.(parsed.content);
          }

          if (parsed.type === "error" && parsed.content) {
            throw new Error(parsed.content);
          }

          if (parsed.type === "done") {
            return;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
