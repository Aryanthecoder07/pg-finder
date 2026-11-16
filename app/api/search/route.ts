/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { embed } from "@/lib/embed";
import { haversineM } from "@/lib/geo";

const PUBLIC = { embedding: 0 };

// GET /api/search?q=&city=&lat=&lng=&km=
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
            numCandidates: near ? 500 : 150,
            limit: near ? 100 : 12, // wider pool when we still have to filter by distance afterwards
            ...(city ? { filter: { city: { $eq: city } } } : {}),
          },
        },
        { $addFields: { score: { $meta: "vectorSearchScore" } } },
        { $project: PUBLIC },
      ])
      .toArray();
  } else if (near) {
    // No text: everything within range, nearest first, optionally limited to a city
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
        { $limit: 30 },
      ])
      .toArray();
  } else {
    // No text, no location: newest first, optionally limited to a city
    docs = await pgs.find(cityFilter, { projection: PUBLIC }).sort({ createdAt: -1 }).limit(30).toArray();
  }

  let out = docs.map((x) => ({
    ...x,
    _id: String(x._id),
    distanceKm: hasPos
      ? Math.round(haversineM(lat, lng, x.location.coordinates[1], x.location.coordinates[0]) / 100) / 10
      : null,
  }));

  // Text + near me: keep only matches within range, nearest first
  if (q && near) {
    out = out
      .filter((x) => x.distanceKm != null && x.distanceKm <= km)
      .sort((a, b) => (a.distanceKm as number) - (b.distanceKm as number))
      .slice(0, 12);
  }

  return NextResponse.json(out);
}