/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { embed } from "@/lib/embed";
import { haversineM } from "@/lib/geo";

const PUBLIC = { embedding: 0 };

// Rating sorts use verified-only ratings. Change to "ratingsAll" to rank by every review, including unverified.
const RATING_FIELD = "ratings";
const RATING_KEYS = ["cleanliness", "food", "value", "ambience"];

// GET /api/search?q=&city=&lat=&lng=&km=&sort=
// Every parameter is optional. Whatever is given is combined as an intersection.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = p.get("q")?.trim() ?? "";
  const city = p.get("city")?.trim() ?? "";
  const lat = Number(p.get("lat"));
  const lng = Number(p.get("lng"));
  const km = Number(p.get("km"));
  const hasPos = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  const near = hasPos && km > 0;
  const cityFilter = city ? { city } : {};

  const sortParam = p.get("sort") ?? "";
  const ratingKey = RATING_KEYS.includes(sortParam) ? sortParam : null;
  const sortField = ratingKey ? `${RATING_FIELD}.${ratingKey}` : "";
  const rating = (x: any): number => x[RATING_FIELD]?.[ratingKey as string] ?? -1; // no rating yet = last

  const pgs = (await db()).collection("pgs");
  let docs: any[];

  if (q) {
    // Meaning-based search, restricted to the city if one is chosen
    let queryVector: number[];
    try {
      queryVector = await embed(q, "RETRIEVAL_QUERY");
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Search is busy right now. Please try again in a moment." }, { status: 503 });
    }
    docs = await pgs
      .aggregate([
        {
          $vectorSearch: {
            index: "pg_vector",
            path: "embedding",
            queryVector,
            // Wider pool when we still have to filter by distance or re-sort by rating afterwards
            numCandidates: near ? 500 : ratingKey ? 200 : 150,
            limit: near ? 100 : ratingKey ? 40 : 12,
            ...(city ? { filter: { city: { $eq: city } } } : {}),
          },
        },
        { $addFields: { score: { $meta: "vectorSearchScore" } } },
        { $project: PUBLIC },
      ])
      .toArray();
  } else if (near) {
    // No text: everything within range, optionally limited to a city. Nearest first unless a rating sort is chosen.
    docs = await pgs
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distanceM",
            maxDistance: km * 1000,
            spherical: true,
            query: cityFilter,
          },
        },
        { $project: PUBLIC },
        { $sort: ratingKey ? { [sortField]: -1, distanceM: 1 } : { distanceM: 1 } },
        { $limit: 30 },
      ])
      .toArray();
  } else {
    // No text, no distance limit: newest first unless a rating sort is chosen
    docs = await pgs
      .find(cityFilter, { projection: PUBLIC })
      .sort(ratingKey ? { [sortField]: -1, createdAt: -1 } : { createdAt: -1 })
      .limit(30)
      .toArray();
  }

  let out: any[] = docs.map((x) => ({
    ...x,
    _id: String(x._id),
    distanceKm: hasPos
      ? Math.round(haversineM(lat, lng, x.location.coordinates[1], x.location.coordinates[0]) / 100) / 10
      : null,
  }));

  // Text search: apply the distance limit and the chosen order to the best matches
  if (q) {
    if (near) out = out.filter((x) => x.distanceKm != null && x.distanceKm <= km);
    if (ratingKey) {
      out.sort((a, b) => rating(b) - rating(a) || (near ? a.distanceKm - b.distanceKm : (b.score ?? 0) - (a.score ?? 0)));
    } else if (near) {
      out.sort((a, b) => a.distanceKm - b.distanceKm);
    }
    out = out.slice(0, 12);
  }

  return NextResponse.json(out);
}