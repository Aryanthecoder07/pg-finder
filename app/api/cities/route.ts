import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const d = await db();
  const rows = await d
    .collection("pgs")
    .aggregate([{ $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }])
    .toArray();
  return NextResponse.json(
    rows.filter((r) => r._id).map((r) => ({ city: r._id as string, count: r.count as number }))
  );
}