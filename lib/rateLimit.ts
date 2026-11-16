import { db } from "./mongodb";

interface Bucket { _id: string; n: number; expiresAt: Date }

// Fixed-window counter in MongoDB. Returns true if the call is allowed.
export async function hit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const d = await db();
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const doc = await d.collection<Bucket>("ratelimits").findOneAndUpdate(
    { _id: `${key}:${bucket}` },
    { $inc: { n: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowSec * 1000 + 3600_000) } },
    { upsert: true, returnDocument: "after" }
  );
  return (doc?.n ?? 1) <= limit;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
