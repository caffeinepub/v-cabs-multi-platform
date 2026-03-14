import type { SavedLocation } from "../types/vcabs";

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

export async function searchLocations(
  query: string,
): Promise<NominatimResult[]> {
  if (!query || query.length < 3) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=0`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VCabs/1.0 (vcabs.app)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return [];
    return (await res.json()) as NominatimResult[];
  } catch {
    return [];
  }
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "VCabs/1.0 (vcabs.app)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

const LS_KEY = (city: string) => `vcabs_saved_locations_${city.toLowerCase()}`;

export function getSavedLocations(city: string): SavedLocation[] {
  try {
    const raw = localStorage.getItem(LS_KEY(city));
    return raw ? (JSON.parse(raw) as SavedLocation[]) : [];
  } catch {
    return [];
  }
}

export function saveLocation(location: SavedLocation): void {
  const existing = getSavedLocations(location.city);
  const updated = [location, ...existing.filter((l) => l.id !== location.id)];
  localStorage.setItem(LS_KEY(location.city), JSON.stringify(updated));
}

export function removeSavedLocation(id: string, city: string): void {
  const existing = getSavedLocations(city);
  localStorage.setItem(
    LS_KEY(city),
    JSON.stringify(existing.filter((l) => l.id !== id)),
  );
}
