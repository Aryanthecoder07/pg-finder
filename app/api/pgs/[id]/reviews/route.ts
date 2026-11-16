import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongodb";
import { refreshPg } from "@/lib/aggregate";
import { validateReview, ReviewInput } from "@/lib/types";
import { currentUserId } from "@/lib/session";
import { hit, clientIp } from "@/lib/rateLimit";
import { checkOnSite } from "@/lib/geo";
import { normalizeCity } from "@/lib/city";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in with Google to post a review." }, { status: 401 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const { geo, ...review } = (await req.json()) as ReviewInput & { geo?: unknown };
  const err = validateReview(review);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const allowed = (await hit(`rev:u:${userId}`, 5, 86400)) && (await hit(`write:ip:${clientIp(req)}`, 20, 86400));
  if (!allowed) return NextResponse.json({ error: "Daily limit reached. Try again tomorrow." }, { status: 429 });

  const pgId = new ObjectId(id);
  const d = await db();
  const pg = await d.collection("pgs").findOne({ _id: pgId }, { projection: { location: 1 } });
  if (!pg) return NextResponse.json({ error: "PG not found" }, { status: 404 });

  const verified = checkOnSite(pg.location.coordinates, geo);
  try {
    await d.collection("reviews").insertOne({ pgId, userId, verified, ...review, createdAt: new Date() });
  } catch (e) {
    if ((e as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "You have already reviewed this PG." }, { status: 409 });
    }
    throw e;
  }
  await refreshPg(pgId);
  return NextResponse.json({ ok: true, verified }, { status: 201 });
}
