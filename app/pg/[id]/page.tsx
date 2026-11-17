import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { db } from "@/lib/mongodb";
import { CUISINES, REGIONS, RESIDENT_TYPES, SHARING } from "@/lib/types";
import AddReview from "@/components/AddReview";
import { currentUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="text-sm">
      <div className="flex justify-between"><span>{label}</span><span>{pct}%</span></div>
      <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-teal-700" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default async function PgPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await currentUserId();
  if (!ObjectId.isValid(id)) notFound();
  const d = await db();
  const pg: any = await d.collection("pgs").findOne({ _id: new ObjectId(id) }, { projection: { embedding: 0 } });
  if (!pg) notFound();
  const reviews: any[] = await d.collection("reviews").find({ pgId: pg._id }).sort({ createdAt: -1 }).limit(50).toArray();
    const mine = userId
    ? await d.collection("reviews").findOne({ pgId: pg._id, userId }, { projection: { _id: 1 } })
    : null;
  const [lng, lat] = pg.location.coordinates;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{pg.name} <span className="text-base font-normal capitalize text-slate-500">· {pg.gender}</span></h1>
        <p className="text-sm text-slate-600">{pg.address}</p>
        <a className="text-sm text-teal-800 underline" target="_blank" rel="noreferrer"
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}>Open exact location in Google Maps</a>
      </div>

      {pg.images?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {pg.images.map((u: string) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" className="h-40 rounded object-cover" />
          ))}
        </div>
      )}

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-semibold">From {pg.reviewCount} resident{pg.reviewCount === 1 ? "" : "s"}</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="font-normal">Room</th><th className="font-normal">Rent / month</th><th className="font-normal">Deposit</th></tr></thead>
            <tbody>
              {Object.entries(pg.rentBySharing ?? {}).map(([s, v]: [string, any]) => (
                <tr key={s} className="border-t border-slate-100">
                  <td>{SHARING[Number(s) as keyof typeof SHARING]}</td>
                  <td>₹{v.avg.toLocaleString("en-IN")}{v.min !== v.max ? ` (₹${v.min.toLocaleString("en-IN")} to ₹${v.max.toLocaleString("en-IN")})` : ""}<span className="text-slate-500">{v.foodIncluded ? " with food" : " no food"} · {v.count} report{v.count === 1 ? "" : "s"}</span></td>
                  <td>₹{v.depositAvg.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pg.extraCharges && <p className="text-xs text-amber-700">Residents report electricity / water / other charges on top of rent.</p>}
          {pg.amenities?.length > 0 && <p className="text-sm">Amenities: {pg.amenities.join(", ")}</p>}
          {pg.ratings ? (
            <div>
              <p className="text-xs text-teal-700">Based on {pg.verifiedCount} on-site verified reviews</p>
              {Object.entries(pg.ratings).map(([k, v]) => (
                <p key={k} className="text-sm capitalize">{k}: <b>{v as number}</b> / 5</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Ratings appear after 3 on-site verified reviews ({pg.verifiedCount ?? 0} so far).</p>
          )}
          <p className="text-xs text-slate-500">All reviews, including unverified: {Object.entries(pg.ratingsAll ?? {}).map(([k, v]) => `${k} ${v}`).join(", ")}</p>
          <p className="text-sm">Food: {(pg.cuisines ?? []).filter((c: string) => (CUISINES as readonly string[]).includes(c)).join(", ")}{pg.menuAvailable ? " (menu available)" : ""}</p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold">Who lives here</h2>
          {Object.entries(RESIDENT_TYPES).map(([k, label]) => <Bar key={k} label={label} pct={pg.residentTypes?.[k] ?? 0} />)}
          <h2 className="pt-2 font-semibold">Community mix</h2>
          {Object.entries(REGIONS).map(([k, label]) => <Bar key={k} label={label} pct={pg.community?.[k] ?? 0} />)}
        </div>
      </section>

     <AddReview pgId={id} signedIn={!!userId} hasReviewed={!!mine} />

      <section className="space-y-4">
        <h2 className="font-semibold">Reviews</h2>
        {reviews.map((r) => (
          <article key={String(r._id)} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">{SHARING[r.sharing as keyof typeof SHARING]}: ₹{r.rentPaid?.toLocaleString("en-IN")} · Clean {r.ratings.cleanliness}/5 · Food {r.ratings.food}/5 · Ambience {r.ratings.ambience}/5 · {new Date(r.createdAt).toLocaleDateString("en-IN")} · <span className={r.verified ? "text-teal-700" : ""}>{r.verified ? "Verified on-site" : "Not verified on-site"}</span></p>
            <p className="mt-1 whitespace-pre-wrap">{r.text}</p>
            {r.images?.length > 0 && (
              <div className="mt-2 flex gap-2">
                {r.images.map((u: string) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={u} alt="" className="h-20 w-20 rounded object-cover" />
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
