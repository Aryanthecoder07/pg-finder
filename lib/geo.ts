export interface Geo { lat: number; lng: number; accuracy: number }

export const ON_SITE_RADIUS_M = 150;
export const MAX_GPS_ACCURACY_M = 150;

export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = (x: number) => (x * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(a));
}

// pgCoords is GeoJSON order: [lng, lat]. The reviewer's raw position is NOT stored, only the yes/no result.
export function checkOnSite(pgCoords: [number, number], geo: unknown): boolean {
  const g = geo as Partial<Geo> | null | undefined;
  if (!g || !Number.isFinite(g.lat) || !Number.isFinite(g.lng) || !Number.isFinite(g.accuracy)) return false;
  if ((g.accuracy as number) > MAX_GPS_ACCURACY_M) return false;
  return haversineM(g.lat as number, g.lng as number, pgCoords[1], pgCoords[0]) <= ON_SITE_RADIUS_M;
}
