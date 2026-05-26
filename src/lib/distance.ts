const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(
  originLatitude: number,
  originLongitude: number,
  destinationLatitude: number,
  destinationLongitude: number,
) {
  const deltaLatitude = toRadians(destinationLatitude - originLatitude);
  const deltaLongitude = toRadians(destinationLongitude - originLongitude);
  const originLatRadians = toRadians(originLatitude);
  const destinationLatRadians = toRadians(destinationLatitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(originLatRadians) *
      Math.cos(destinationLatRadians) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function estimateMinutes(distanceKm: number) {
  const cityDrivingKmPerHour = 18;
  return Math.max(1, Math.round((distanceKm / cityDrivingKmPerHour) * 60));
}

export function formatDistance(distanceKm: number | null, minutes: number | null) {
  if (distanceKm === null || minutes === null) {
    return "Distance available after location access";
  }

  return `${minutes} min away - ${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}
