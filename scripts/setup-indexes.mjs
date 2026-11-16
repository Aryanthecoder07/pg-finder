// Run once:  npm run setup:db
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || "pgfinder");

const existing = (await db.listCollections().toArray()).map((c) => c.name);
for (const name of ["pgs", "reviews", "ratelimits"]) if (!existing.includes(name)) await db.createCollection(name);

await db.collection("pgs").createIndex({ location: "2dsphere" });
await db.collection("reviews").createIndex({ pgId: 1, createdAt: -1 });
await db.collection("reviews").createIndex({ pgId: 1, userId: 1 }, { unique: true }); // one review per account per PG
await db.collection("ratelimits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-clean counters

try {
  await db.collection("pgs").createSearchIndex({
    name: "pg_vector",
    type: "vectorSearch",
    definition: {
      fields: [
        { type: "vector", path: "embedding", numDimensions: Number(process.env.EMBEDDING_DIMS || 768), similarity: "cosine" },
        { type: "filter", path: "city" },
      ],
    },
  });
  console.log("Vector index requested. It can take a minute or two to become ACTIVE in Atlas.");
} catch (e) {
  console.log("Vector index not created (maybe it already exists):", e.message);
}
await client.close();
console.log("Done.");
