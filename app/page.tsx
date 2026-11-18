"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PgCard from "@/components/PgCard";

/* eslint-disable @typescript-eslint/no-explicit-any */
const NEAR_OPTIONS = [2, 5, 10];
const RATING_SORTS = ["cleanliness", "food", "value", "ambience"];
const SORTS = [
  { v: "auto", l: "Recommended" },
  { v: "nearest", l: "Nearest first" },
  { v: "cleanliness", l: "Cleanliness" },
  { v: "food", l: "Food" },
  { v: "value", l: "Value for money" },
  { v: "ambience", l: "Ambience" },
];

const EXAMPLES = [
  "Clean girls PG with South Indian food",
  "2 sharing under ₹8,000 with Wi-Fi",
  "Quiet PG, mostly 9-to-5 office-goers",
  "Boys PG with North Indian food and a weekly menu",
];

const TRUST = [
  { t: "Checked on-site", d: "Ratings count reviews written by people who were at the PG when they posted." },
  { t: "Rent that makes sense", d: "Rent and deposit by sharing type, and whether food and electricity are included." },
  { t: "Know who you will live with", d: "Office-goers or students? South or North Indian? See the real mix, not a brochure." },
];

const STEPS = [
  { n: "1", t: "Pick your city and describe what you want", d: "Type it the way you would tell a friend. We match the meaning, not just keywords." },
  { n: "2", t: "Compare real conditions", d: "Cleanliness, food, who stays there, photos from residents and rent by room type." },
  { n: "3", t: "Visit with confidence", d: "Open the exact pin in Google Maps and go in knowing what to expect." },
];

const selectCls =
  "rounded-full border border-white/30 bg-teal-900 px-3 py-1.5 text-sm text-white focus:outline-none";

type Coords = { lat: number; lng: number };
type Override = { q?: string; city?: string; near?: boolean; nearKm?: number; sort?: string };

export default function Home() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [near, setNear] = useState(false);
  const [nearKm, setNearKm] = useState(5);
  const [sort, setSort] = useState("auto");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);
  const [list, setList] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [label, setLabel] = useState("Recently added");
  const [active, setActive] = useState(false);
  const seq = useRef(0);

  function getCoords(): Promise<Coords> {
    if (coords) return Promise.resolve(coords);
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("This browser does not support location."));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          resolve(c);
        },
        (e) => reject(new Error(e.message)),
        { timeout: 15000 }
      );
    });
  }

  // One function for every combination of search text, city, near me, distance and sort.
  async function run(o: Override = {}) {
    if (o.q !== undefined) setQ(o.q);
    if (o.city !== undefined) setCity(o.city);
    if (o.near !== undefined) setNear(o.near);
    if (o.nearKm !== undefined) setNearKm(o.nearKm);
    const f = {
      q: (o.q ?? q).trim(),
      city: o.city ?? city,
      near: o.near ?? near,
      nearKm: o.nearKm ?? nearKm,
      sort: o.sort ?? sort,
    };

    const id = ++seq.current;
    setLoading(true);
    setNote("");

    // Once location has been shared, distances keep showing on cards even when "Near me" is off
    let c: Coords | null = coords;
    if (f.near) {
      try {
        c = await getCoords();
      } catch (e) {
        f.near = false;
        setNear(false);
        setNote(`Could not get your location: ${(e as Error).message}`);
      }
    }
    if (!f.near && f.sort === "nearest") f.sort = "auto";
    setSort(f.sort);

    // Keep the filters in the address bar so refresh, Back and shared links restore this view
    const u = new URLSearchParams();
    if (f.q) u.set("q", f.q);
    if (f.city) u.set("city", f.city);
    if (f.near) { u.set("near", "1"); u.set("km", String(f.nearKm)); }
    if (f.sort !== "auto") u.set("sort", f.sort);
    history.replaceState(null, "", u.toString() ? `/?${u}` : "/");

    const qs = new URLSearchParams();
    if (f.q) qs.set("q", f.q);
    if (f.city) qs.set("city", f.city);
    if (c) { qs.set("lat", String(c.lat)); qs.set("lng", String(c.lng)); }
    if (f.near && c) qs.set("km", String(f.nearKm));
    if (f.sort !== "auto") qs.set("sort", f.sort);

    const res = await fetch(`/api/search?${qs}`);
    if (id !== seq.current) return; // a newer request has started
    setLoading(false);
    if (!res.ok) {
      setNote((await res.json().catch(() => null))?.error ?? "Search failed. Check the server logs.");
      return;
    }
    setList(await res.json());

    const filtered = !!(f.q || f.city || f.near || f.sort !== "auto");
    setActive(filtered);
    const sortLabel = SORTS.find((s) => s.v === f.sort)?.l ?? "";
    const base = f.q ? `Results for “${f.q}”` : filtered ? "PGs" : "Recently added";
    setLabel(
      filtered
        ? `${base}${f.city ? ` in ${f.city}` : ""}${f.near ? ` within ${f.nearKm} km of you` : ""}${
            f.sort !== "auto" ? `, sorted by ${sortLabel.toLowerCase()}` : ""
          }`
        : base
    );
  }

  useEffect(() => {
    (async () => {
      let found: { city: string; count: number }[] = [];
      try {
        const r = await fetch("/api/cities");
        if (r.ok) found = await r.json();
      } catch {}
      setCities(found);

      const sp = new URLSearchParams(window.location.search);
      const hasUrl = ["q", "city", "near", "sort"].some((k) => sp.has(k));
      let saved = "";
      try { saved = localStorage.getItem("pg_city") ?? ""; } catch {}
      const savedOk = found.some((c) => c.city === saved) ? saved : "";
      const kmParam = Number(sp.get("km"));
      const sortParam = sp.get("sort") ?? "auto";

      // The address bar wins; otherwise fall back to the remembered city
      await run({
        q: sp.get("q") ?? "",
        city: hasUrl ? sp.get("city") ?? "" : savedOk,
        near: sp.get("near") === "1",
        nearKm: NEAR_OPTIONS.includes(kmParam) ? kmParam : 5,
        sort: SORTS.some((s) => s.v === sortParam) ? sortParam : "auto",
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseCity(v: string) {
    try { localStorage.setItem("pg_city", v); } catch {}
    run({ city: v });
  }

  function clearAll() {
    try { localStorage.removeItem("pg_city"); } catch {}
    run({ q: "", city: "", near: false, sort: "auto" });
  }

  const selectedMissing = city && !cities.some((c) => c.city === city);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-teal-950 px-6 py-12 text-white sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-700/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-amber-300">
            Reviews from people who actually live there
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Find a PG that matches how you actually live.
          </h1>
          <p className="mt-4 text-teal-100/90">
            Rent by sharing type, who stays there, what the food is really like and how clean it is. Told by residents,
            checked on-site, and searchable in your own words.
          </p>
        </div>

        <form
          className="relative mt-8 flex max-w-2xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
          onSubmit={(e) => { e.preventDefault(); run(); }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What are you looking for?"
            aria-label="Search PGs"
          />
          <button type="submit" disabled={loading} className="btn px-6 py-2.5">
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {/* Filters: city, near me, distance and sort. They combine with the search text. */}
        <div className="relative mt-4 flex max-w-2xl flex-wrap items-center gap-2">
          <select value={city} onChange={(e) => chooseCity(e.target.value)} aria-label="City" className={selectCls}>
            <option value="" className="bg-white text-slate-900">All cities</option>
            {selectedMissing && <option value={city} className="bg-white text-slate-900">{city}</option>}
            {cities.map((c) => (
              <option key={c.city} value={c.city} className="bg-white text-slate-900">
                {c.city} ({c.count})
              </option>
            ))}
          </select>

          <button
            type="button"
            aria-pressed={near}
            onClick={() => run({ near: !near })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              near ? "bg-amber-300 text-teal-950" : "border border-white/30 text-white hover:bg-white/10"
            }`}
          >
            {near ? "Near me ✓" : "Near me"}
          </button>

          {near && (
            <select
              value={nearKm}
              onChange={(e) => run({ nearKm: Number(e.target.value) })}
              aria-label="Distance"
              className={selectCls}
            >
              {NEAR_OPTIONS.map((k) => (
                <option key={k} value={k} className="bg-white text-slate-900">Within {k} km</option>
              ))}
            </select>
          )}

          <select value={sort} onChange={(e) => run({ sort: e.target.value })} aria-label="Sort by" className={selectCls}>
            {SORTS.filter((s) => s.v !== "nearest" || near).map((s) => (
              <option key={s.v} value={s.v} className="bg-white text-slate-900">Sort: {s.l}</option>
            ))}
          </select>

          {active && (
            <button type="button" onClick={clearAll} className="px-2 py-1.5 text-sm text-teal-100/80 underline underline-offset-4">
              Clear all
            </button>
          )}
        </div>

        {RATING_SORTS.includes(sort) && (
          <p className="relative mt-2 max-w-2xl text-xs text-teal-100/80">
            Rating sorts use on-site verified reviews. PGs without 3 verified reviews are listed last.
          </p>
        )}

        <div className="relative mt-4 flex max-w-2xl flex-wrap items-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => run({ q: ex })}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-teal-50 hover:bg-white/10"
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      {/* Trust strip (only when nothing is filtered) */}
      {!active && (
        <section className="grid gap-4 sm:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.t} className="rounded-2xl border border-slate-200 border-t-4 border-t-teal-700 bg-white p-5">
              <h3 className="font-display text-lg font-semibold">{t.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{t.d}</p>
            </div>
          ))}
        </section>
      )}

      {/* Results */}
      <section>
        <h2 className="mb-4 font-display text-2xl font-bold">{label}</h2>
        {note && <p className="mb-3 text-sm text-red-600">{note}</p>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : list && list.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((pg) => <PgCard key={pg._id} pg={pg} />)}
          </div>
        ) : list ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-display text-lg font-semibold">{active ? "No matches yet" : "No PGs added yet"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {active ? "Try a different city, a wider distance, or turn off “Near me”. Or add the PG you live in." : "Be the first to add the PG you live in."}
            </p>
            <Link href="/add" className="btn mt-4 inline-block">Add your PG</Link>
          </div>
        ) : null}
      </section>

      {!active && (
        <>
          <section>
            <h2 className="font-display text-2xl font-bold">How it works</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-amber-300 font-display text-sm font-bold text-teal-950">
                    {s.n}
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-teal-800 px-6 py-10 text-center text-white">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Live in a PG? Tell the next person the truth.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-teal-50/90">
              It takes a few minutes: your room type and rent, who lives there, the food, and a few photos.
            </p>
            <Link href="/add" className="mt-5 inline-block rounded-full bg-amber-300 px-6 py-2.5 text-sm font-semibold text-teal-950 hover:bg-amber-200">
              Add your PG
            </Link>
          </section>
        </>
      )}
    </div>
  );
}