// Pluggable embeddings: "gemini" (default) or any OpenAI-compatible /embeddings endpoint (Groq, Together, local servers...).
// EMBEDDING_DIMS must match the Atlas vector index. Changing provider/model means re-embedding every PG (npm run reembed).
const DIMS = Number(process.env.EMBEDDING_DIMS || 768);
type Task = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

const queryCache = new Map<string, number[]>(); // small in-memory cache so repeated searches cost nothing
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

async function request(text: string, task: Task): Promise<Response> {
  const provider = process.env.EMBEDDING_PROVIDER || "gemini";
  if (provider === "gemini") {
    const model = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.EMBEDDING_API_KEY || process.env.GEMINI_API_KEY || "",
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType: task,
        outputDimensionality: DIMS,
      }),
    });
  }
  // OpenAI-compatible (e.g. Groq: EMBEDDING_BASE_URL=https://api.groq.com/openai/v1)
  const model = process.env.EMBEDDING_MODEL || "";
  const base = (process.env.EMBEDDING_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const prefix = /nomic/i.test(model) ? (task === "RETRIEVAL_QUERY" ? "search_query: " : "search_document: ") : "";
  return fetch(`${base}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.EMBEDDING_API_KEY || ""}` },
    body: JSON.stringify({ model, input: prefix + text }),
  });
}

async function parse(res: Response): Promise<number[]> {
  const j = await res.json();
  return (j.embedding?.values ?? j.data?.[0]?.embedding) as number[];
}

export async function embed(text: string, task: Task): Promise<number[]> {
  const key = `${process.env.EMBEDDING_PROVIDER}|${process.env.EMBEDDING_MODEL}|${text.toLowerCase()}`;
  if (task === "RETRIEVAL_QUERY" && queryCache.has(key)) return queryCache.get(key)!;

  let lastErr = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await request(text, task);
    if (res.ok) {
      const v = await parse(res);
      if (!Array.isArray(v) || v.length !== DIMS) {
        throw new Error(`Embedding has ${v?.length} dimensions but EMBEDDING_DIMS is ${DIMS}. Fix the model or the index.`);
      }
      if (task === "RETRIEVAL_QUERY") {
        if (queryCache.size >= 500) queryCache.delete(queryCache.keys().next().value as string);
        queryCache.set(key, v);
      }
      return v;
    }
    lastErr = `${res.status} ${await res.text()}`;
    if (!RETRYABLE.has(res.status)) break;
    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep((retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt) + Math.random() * 250);
  }
  throw new Error(`Embedding failed: ${lastErr}`);
}