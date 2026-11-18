import Link from "next/link";
import { REGIONS } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function Pill({ children, muted, title }: { children: React.ReactNode; muted?: boolean; title?: string }) {
  return (
    <span title={title} className={`rounded-full px-2.5 py-1 ${muted ? "bg-slate-100 text-slate-500" : "bg-teal-50 text-teal-900"}`}>
      {children}
    </span>
  );
}

// Approximate, straight-line distance
function approx(km: number) {
  if (km < 1) return `~${Math.max(100, Math.round(km * 10) * 100)} m away in a straight line`;
  return `~${km.toFixed(1)} km away in a straight line`;
}

export default function PgCard({ pg }: { pg: any }) {
  const mix = Object.entries(pg.community ?? {})
    .filter(([, v]) => (v as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 2)
    .map(([k, v]) => `${v}% ${REGIONS[k as keyof typeof REGIONS]}`)
    .join(", ");
  const km: number | null = pg.distanceKm ?? (pg.distanceM != null ? Math.round(pg.distanceM / 100) / 10 : null);

  return (
    <Link
      href={`/pg/${pg._id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] bg-slate-100">
        {pg.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pg.images[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-400">No photos yet</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium capitalize text-slate-800">
          {pg.gender === "coed" ? "Co-ed" : pg.gender}
        </span>
        {pg.verifiedCount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-teal-700 px-2.5 py-1 text-xs font-medium text-white">
            Verified on-site
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug text-slate-900">{pg.name}</h3>
          <p className="shrink-0 text-right leading-tight">
            <span className="text-xs text-slate-500">from</span>
            <br />
            <span className="font-display text-lg font-bold text-teal-800">₹{pg.rentMin?.toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-500">/mo</span>
          </p>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{pg.address}</p>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          {km != null && (
            <span
              title="Straight-line distance from your location, not road distance"
              className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-900"
            >
              {approx(km)}
            </span>
          )}
          {pg.ratings ? (
            <>
              <Pill>Clean {pg.ratings.cleanliness}/5</Pill>
              <Pill>Food {pg.ratings.food}/5</Pill>
              <Pill>Value {pg.ratings.value}/5</Pill>
              <Pill>Ambience {pg.ratings.ambience}/5</Pill>
            </>
          ) : (
            <Pill muted>Rating after 3 verified reviews ({pg.verifiedCount ?? 0}/3)</Pill>
          )}
          {mix && <Pill>{mix}</Pill>}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {pg.reviewCount} review{pg.reviewCount === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}