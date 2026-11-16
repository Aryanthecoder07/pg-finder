import { ObjectId } from "mongodb";
import { db } from "./mongodb";
import { embed } from "./embed";
import { REGIONS, RESIDENT_TYPES, SHARING } from "./types";

const avg = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

// Recomputes averages from all reviews, rebuilds the searchable text, and re-embeds it.
export async function refreshPg(pgId: ObjectId) {
  const d = await db();
  const pg = await d.collection("pgs").findOne({ _id: pgId });
  if (!pg) return;
  const reviews = await d.collection("reviews").find({ pgId }).sort({ createdAt: -1 }).toArray();

  const ratingsOf = (list: typeof reviews) => ({
    cleanliness: round1(avg(list.map((r) => r.ratings.cleanliness))),
    food: round1(avg(list.map((r) => r.ratings.food))),
    ambience: round1(avg(list.map((r) => r.ratings.ambience))),
    value: round1(avg(list.map((r) => r.ratings.value))),
  });
  const verified = reviews.filter((r) => r.verified);
  const ratingsAll = ratingsOf(reviews);
  // Headline rating uses ON-SITE VERIFIED reviews only, and only once there are at least 3 of them.
  const ratings = verified.length >= 3 ? ratingsOf(verified) : null;
  const community: Record<string, number> = {};
  for (const k of Object.keys(REGIONS)) community[k] = Math.round(avg(reviews.map((r) => r.community[k])));
  const residentTypes: Record<string, number> = {};
  for (const k of Object.keys(RESIDENT_TYPES)) residentTypes[k] = Math.round(avg(reviews.map((r) => r.residentTypes[k])));
  const cuisines = [...new Set(reviews.flatMap((r) => r.cuisines as string[]))];
  const rents = reviews.map((r) => r.rentPaid as number);

  // Rent grouped by sharing type: { "2": { avg, min, max, count, depositAvg, foodIncluded } }
  const rentBySharing: Record<string, { avg: number; min: number; max: number; count: number; depositAvg: number; foodIncluded: boolean }> = {};
  for (const s of Object.keys(SHARING)) {
    const rs = reviews.filter((r) => String(r.sharing) === s);
    if (!rs.length) continue;
    const vals = rs.map((r) => r.rentPaid as number);
    rentBySharing[s] = {
      avg: Math.round(avg(vals)),
      min: Math.min(...vals),
      max: Math.max(...vals),
      count: rs.length,
      depositAvg: Math.round(avg(rs.map((r) => (r.deposit as number) || 0))),
      foodIncluded: rs.filter((r) => r.foodIncluded).length > rs.length / 2,
    };
  }
  const rentText = Object.entries(rentBySharing)
    .map(([s, v]) => `${SHARING[Number(s) as keyof typeof SHARING]} about ${v.avg} rupees per month${v.foodIncluded ? " with food" : " without food"}`)
    .join("; ");
  const amenityCounts: Record<string, number> = {};
  for (const r of reviews) for (const a of (r.amenities ?? []) as string[]) amenityCounts[a] = (amenityCounts[a] ?? 0) + 1;
  const amenities = Object.entries(amenityCounts).filter(([, n]) => n > reviews.length / 2).map(([a]) => a);
  const extraCharges = reviews.filter((r) => r.extraCharges).length > reviews.length / 2;
  const menuAvailable = reviews.filter((r) => r.menuAvailable).length > reviews.length / 2;

  const topCommunity = Object.entries(community)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v}% ${REGIONS[k as keyof typeof REGIONS]}`)
    .join(", ");
  const topTypes = Object.entries(residentTypes)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v}% ${RESIDENT_TYPES[k as keyof typeof RESIDENT_TYPES]}`)
    .join(", ");

  const searchText = [
    `${pg.name}, ${pg.address}, ${pg.city}. ${pg.gender} PG.`,
    rentText ? `Rent: ${rentText}.${extraCharges ? " Electricity and other charges extra." : ""}` : "",
    amenities.length ? `Amenities: ${amenities.join(", ")}.` : "",
    `Residents: ${topTypes}. Community: ${topCommunity}.`,
    `Food: ${cuisines.join(", ")}${menuAvailable ? ", menu available" : ""}.`,
    `Cleanliness ${ratingsAll.cleanliness}/5, food ${ratingsAll.food}/5, ambience ${ratingsAll.ambience}/5.`,
    ...reviews.slice(0, 8).map((r) => r.text as string),
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 6000);

  let embedding: number[] | null = null;
  try {
    embedding = await embed(searchText, "RETRIEVAL_DOCUMENT");
  } catch (e) {
    console.error("Embedding failed; keeping the previous embedding if any:", e); // run `npm run reembed` later
  }
  const images = reviews.flatMap((r) => r.images as string[]).slice(0, 12);

  await d.collection("pgs").updateOne(
    { _id: pgId },
    {
      $set: {
        reviewCount: reviews.length,
        ratings,
        ratingsAll,
        verifiedCount: verified.length,
        community,
        residentTypes,
        cuisines,
        menuAvailable,
        rentBySharing,
        amenities,
        extraCharges,
        rentAvg: Math.round(avg(rents)),
        rentMin: Math.min(...rents),
        rentMax: Math.max(...rents),
        images,
        searchText,
        ...(embedding ? { embedding } : {}),
        updatedAt: new Date(),
      },
    }
  );
}