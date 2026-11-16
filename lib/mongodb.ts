import { MongoClient } from "mongodb";

const g = globalThis as unknown as { _mongo?: Promise<MongoClient> };

function client() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  return (g._mongo ??= new MongoClient(process.env.MONGODB_URI).connect());
}

export async function db() {
  return (await client()).db(process.env.MONGODB_DB || "pgfinder");
}
