"use client";
import { AMENITIES, CUISINES, REGIONS, RESIDENT_TYPES, SHARING, ReviewInput } from "@/lib/types";
import ImageUploader from "./ImageUploader";

const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);

function PercentGroup<K extends string>({
  title, labels, value, onChange,
}: {
  title: string;
  labels: Record<K, string>;
  value: Record<K, number>;
  onChange: (v: Record<K, number>) => void;
}) {
  const total = sum(value);
  return (
    <fieldset>
      <legend className="label">{title}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(Object.keys(labels) as K[]).map((k) => (
          <label key={k} className="text-xs text-slate-600">
            {labels[k]} (%)
            <input
              type="number" min={0} max={100} className="input mt-1"
              value={value[k]}
              onChange={(e) => onChange({ ...value, [k]: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
            />
          </label>
        ))}
      </div>
      <p className={`mt-1 text-xs ${total === 100 ? "text-teal-700" : "text-red-600"}`}>Total: {total}% (must be 100)</p>
    </fieldset>
  );
}

export default function ReviewForm({ value, onChange }: { value: ReviewInput; onChange: (r: ReviewInput) => void }) {
  const set = (patch: Partial<ReviewInput>) => onChange({ ...value, ...patch });
  const ratingKeys = ["cleanliness", "food", "ambience", "value"] as const;

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="label">Your room and rent</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="text-xs text-slate-600">Sharing type
            <select className="input mt-1" value={value.sharing} onChange={(e) => set({ sharing: Number(e.target.value) as ReviewInput["sharing"] })}>
              {Object.entries(SHARING).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-600">Rent per month (₹)
            <input type="number" min={0} className="input mt-1" value={value.rentPaid || ""} onChange={(e) => set({ rentPaid: Number(e.target.value) })} />
          </label>
          <label className="text-xs text-slate-600">Security deposit (₹)
            <input type="number" min={0} className="input mt-1" value={value.deposit || ""} onChange={(e) => set({ deposit: Number(e.target.value) })} />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-1"><input type="checkbox" checked={value.foodIncluded} onChange={(e) => set({ foodIncluded: e.target.checked })} /> Food is included in the rent</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={value.extraCharges} onChange={(e) => set({ extraCharges: e.target.checked })} /> Electricity / water / maintenance charged extra</label>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          {AMENITIES.map((a) => (
            <label key={a} className="flex items-center gap-1">
              <input type="checkbox" checked={value.amenities.includes(a)}
                onChange={(e) => set({ amenities: e.target.checked ? [...value.amenities, a] : value.amenities.filter((x) => x !== a) })} />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <PercentGroup title="Who lives here? (rough % of residents)" labels={RESIDENT_TYPES} value={value.residentTypes} onChange={(residentTypes) => set({ residentTypes })} />
      <PercentGroup title="Community mix (rough % of residents)" labels={REGIONS} value={value.community} onChange={(community) => set({ community })} />

      <fieldset>
        <legend className="label">Food served</legend>
        <div className="flex flex-wrap gap-3 text-sm">
          {CUISINES.map((c) => (
            <label key={c} className="flex items-center gap-1">
              <input
                type="checkbox" checked={value.cuisines.includes(c)}
                onChange={(e) => set({ cuisines: e.target.checked ? [...value.cuisines, c] : value.cuisines.filter((x) => x !== c) })}
              />
              {c}
            </label>
          ))}
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={value.menuAvailable} onChange={(e) => set({ menuAvailable: e.target.checked })} />
          A weekly menu is available
        </label>
      </fieldset>

      <fieldset>
        <legend className="label">Ratings (1 = poor, 5 = excellent)</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ratingKeys.map((k) => (
            <label key={k} className="text-xs capitalize text-slate-600">
              {k}
              <select className="input mt-1" value={value.ratings[k]} onChange={(e) => set({ ratings: { ...value.ratings, [k]: Number(e.target.value) } })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="label">What is it really like to live here?</span>
        <textarea rows={5} className="input" value={value.text} onChange={(e) => set({ text: e.target.value })}
          placeholder="Water supply, noise, curfew, washroom cleaning schedule, food quality, owner behaviour…" />
      </label>

      <ImageUploader urls={value.images} onChange={(images) => set({ images })} />
    </div>
  );
}
