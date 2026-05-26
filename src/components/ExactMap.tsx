"use client";

type ExactMapProps = {
  latitude: number;
  longitude: number;
  label?: string;
};

export function ExactMap({ latitude, longitude, label = "Parking location" }: ExactMapProps) {
  const configuredKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const key = configuredKey.startsWith("your-") ? "" : configuredKey;
  const query = `${latitude},${longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className="space-y-3">
      <div className="h-72 overflow-hidden rounded-lg border border-[#dbe3df] bg-[#eef5f1]">
        {key ? (
          <iframe
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=${key}&q=${query}`}
            title={label}
          />
        ) : (
          <div className="grid h-full place-items-center p-5 text-center text-sm font-bold text-[#6b7772]">
            Exact coordinates unlocked: {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a className="btn-primary" href={mapsUrl} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
        <a className="btn-secondary" href={directionsUrl} target="_blank" rel="noreferrer">
          Get Directions
        </a>
      </div>
    </div>
  );
}
