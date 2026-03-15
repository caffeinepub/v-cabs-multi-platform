/**
 * Format fare showing both INR and V Coins.
 * 1 V Coin = ₹5
 */
export function formatFare(vcCoins: number): string {
  return `₹${vcCoins * 5} / ${vcCoins} VC`;
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate fare from distance (km) and base rate (₹/km), returning V Coins.
 * 1 VC = ₹5
 */
export function fareFromDistance(
  distanceKm: number,
  baseRatePerKm: number,
  multiplier: number,
): number {
  const inr = Math.max(
    distanceKm * baseRatePerKm * multiplier,
    baseRatePerKm * multiplier,
  );
  return Math.round(inr / 5); // convert INR to V Coins
}
