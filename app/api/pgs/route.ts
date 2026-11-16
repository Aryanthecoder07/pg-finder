import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { refreshPg } from "@/lib/aggregate";
import { validateReview, ReviewInput } from "@/lib/types";
import { currentUserId } from "@/lib/session";
import { hit, clientIp } from "@/lib/rateLimit";
import { checkOnSite } from "@/lib/geo";
import { normalizeCity } from "@/lib/city";

const PUBLIC = { embedding: 0 };

// GET /api/pgs?lat=..&lng=..&km=5  -> nearby PGs (or latest if no coords)
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const lat = Number(p.get("lat"));
  const lng = Number(p.get("lng"));
  const km = Number(p.get("km") || 5);
  const d = await db();

  const docs =
    lat && lng
      ? await d
          .collection("pgs")
          .aggregate([
            {
              $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "distanceM",
                maxDistance: km * 1000,
                spherical: true,
              },
            },
            { $project: PUBLIC },
            { $limit: 30 },
          ])
          .toArray()
      : await d.collection("pgs").find({}, { projection: PUBLIC }).sort({ createdAt: -1 }).limit(30).toArray();

  return NextResponse.json(docs.map((x) => ({ ...x, _id: String(x._id) })));
}

// POST /api/pgs  -> create a PG together with its first review (sign-in required)
export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Sign in with Google to add a PG." }, { status: 401 });

  const b = await req.json();
  const review = b.review as ReviewInput;
  const lat = Number(b.lat);
  const lng = Number(b.lng);

  if (!b.name?.trim() || !b.address?.trim() || !b.city?.trim()) {
    return NextResponse.json({ error: "Name, address and city are required." }, { status: 400 });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (!lat && !lng)) {
    return NextResponse.json({ error: "Pin the PG's location first." }, { status: 400 });
  }
  const err = validateReview(review);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const allowed = (await hit(`pg:u:${userId}`, 3, 86400)) && (await hit(`write:ip:${clientIp(req)}`, 20, 86400));
  if (!allowed) return NextResponse.json({ error: "Daily limit reached. Try again tomorrow." }, { status: 429 });

  const verified = checkOnSite([lng, lat], b.geo);
  const d = await db();
  const now = new Date();
  const { insertedId } = await d.collection("pgs").insertOne({
    name: String(b.name).trim(),
    address: String(b.address).trim(),
     city: normalizeCity(b.city),
    gender: ["boys", "girls", "coed"].includes(b.gender) ? b.gender : "coed",
    location: { type: "Point", coordinates: [lng, lat] },
    reviewCount: 0,
    createdAt: now,
  });
  await d.collection("reviews").insertOne({ pgId: insertedId, userId, verified, ...review, createdAt: now });
  await refreshPg(insertedId);

  return NextResponse.json({ id: String(insertedId), verified }, { status: 201 });
}
