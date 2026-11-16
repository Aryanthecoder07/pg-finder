// Re-embeds every PG from its stored searchText. Run after changing embedding provider/model:  npm run reembed
import { MongoClient } from "mongodb";

const DIMS = Number(process.env.EMBEDDING_DIMS || 768);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embedDoc(text) {
  const provider = process.env.EMBEDDING_PROVIDER || "gemini";
  const model = process.env.EMBEDDING_MODEL || (provider === "gemini" ? "gemini-embedding-001" : "");
  for (let i = 0; i < 5; i++) {
    let res;
    if (provider === "gemini") {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.EMBEDDING_API_KEY || process.env.GEMINI_API_KEY || "" },
        body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text }] }, taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: DIMS }),
      });
    } else {
      const base = (process.env.EMBEDDING_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, "");
      const prefix = /nomic/i.test(model) ? "search_document: " : "";
      res = await fetch(`${base}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.EMBEDDING_API_KEY || ""}` },
        body: JSON.stringify({ model, input: prefix + text }),
      });
    }
    if (res.ok) {
      const j = await res.json();
      const v = j.embedding?.values ?? j.data?.[0]?.embedding;
      if (!Array.isArray(v) || v.length !== DIMS) throw new Error(`Got ${v?.length} dimensions, expected ${DIMS}`);
      return v;
    }
    if (![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`${res.status} ${await res.text()}`);
    await sleep(1000 * 2 ** i);
  }
  throw new Error("Embedding kept failing");
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const pgs = client.db(process.env.MONGODB_DB || "pgfinder").collection("pgs");
let ok = 0, skipped = 0;
for await (const pg of pgs.find({ searchText: { $exists: true } }, { projection: { searchText: 1, name: 1 } })) {
  try {
    await pgs.updateOne({ _id: pg._id }, { $set: { embedding: await embedDoc(pg.searchText) } });
    ok++;
    await sleep(300); // be gentle with rate limits
  } catch (e) {
    skipped++;
    console.log(`Skipped ${pg.name}: ${e.message}`);
  }
}
console.log(`Re-embedded ${ok} PG(s), skipped ${skipped}.`);
await client.close();