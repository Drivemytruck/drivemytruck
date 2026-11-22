/** UK postcode helpers using the free postcodes.io API (no key needed). */

export function normalisePostcode(input: string) {
  return input.toUpperCase().replace(/\s+/g, "").replace(/^(.+)(\d[A-Z]{2})$/, "$1 $2").trim();
}

export function isValidUkPostcode(input: string) {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(input.trim()) || /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(input.trim());
}

export type GeoResult = { postcode: string; town: string | null; lat: number | null; lng: number | null };

/**
 * Looks up a full postcode (e.g. "B1 1AA") or an outward code (e.g. "B1").
 * Never throws: if the lookup fails we still save the postcode, just without coordinates.
 */
export async function geocodePostcode(raw: string): Promise<GeoResult> {
  const pc = normalisePostcode(raw);
  const isOutcode = !pc.includes(" ");
  const url = isOutcode
    ? `https://api.postcodes.io/outcodes/${encodeURIComponent(pc)}`
    : `https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000), next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) return { postcode: pc, town: null, lat: null, lng: null };
    const data = (await res.json()) as {
      result?: { latitude?: number; longitude?: number; admin_district?: string | string[]; post_town?: string };
    };
    const r = data.result;
    const district = Array.isArray(r?.admin_district) ? r?.admin_district[0] : r?.admin_district;
    return {
      postcode: pc,
      town: r?.post_town ?? district ?? null,
      lat: r?.latitude ?? null,
      lng: r?.longitude ?? null,
    };
  } catch {
    return { postcode: pc, town: null, lat: null, lng: null };
  }
}

/** Great-circle distance in miles. */
export function distanceMiles(
  a: { lat: number | null; lng: number | null },
  b: { lat: number | null; lng: number | null },
): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
