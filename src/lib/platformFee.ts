export const PLATFORM_FEE_RATE = 0.05;

function roundToNearestRupee(amount: number) {
  return Math.round(Number(amount || 0));
}

export function calculatePlatformFeeAmount(selectedPrice: number) {
  return roundToNearestRupee(Number(selectedPrice || 0) * PLATFORM_FEE_RATE);
}

export function calculateTotalAmount(selectedPrice: number) {
  return Number(selectedPrice || 0) + calculatePlatformFeeAmount(selectedPrice);
}
