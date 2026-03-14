/**
 * Format fare showing both INR and V Coins.
 * 1 V Coin = ₹5
 */
export function formatFare(vcCoins: number): string {
  return `₹${vcCoins * 5} / ${vcCoins} VC`;
}
