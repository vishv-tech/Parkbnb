"use client";

import { useEffect, useRef, useState } from "react";

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type MapPickerProps = {
  address: string;
  value: Coordinates;
  onChange: (coordinates: Coordinates) => void;
};

type GoogleMapsNamespace = {
  maps: {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMap;
    Marker: new (options: Record<string, unknown>) => GoogleMarker;
    Geocoder: new () => GoogleGeocoder;
    LatLng: new (latitude: number, longitude: number) => unknown;
  };
};

type GoogleMap = {
  addListener: (eventName: string, listener: (event: GoogleMapMouseEvent) => void) => void;
  setCenter: (position: { lat: number; lng: number }) => void;
};

type GoogleMarker = {
  setPosition: (position: { lat: number; lng: number }) => void;
};

type GoogleGeocoder = {
  geocode: (
    request: { address: string },
    callback: (results: Array<{ geometry: { location: GoogleLocation } }> | null, status: string) => void,
  ) => void;
};

type GoogleLocation = {
  lat: () => number;
  lng: () => number;
};

type GoogleMapMouseEvent = {
  latLng?: GoogleLocation;
};

declare global {
  interface Window {
    google?: GoogleMapsNamespace;
  }
}

function mapsKey() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  return key.startsWith("your-") ? "" : key;
}

export function MapPicker({ address, value, onChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const googleMapRef = useRef<GoogleMap | null>(null);
  const onChangeRef = useRef(onChange);
  const [mapReady, setMapReady] = useState(false);
  const [message, setMessage] = useState("");
  const key = mapsKey();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!key || !mapRef.current) {
      return;
    }

    function initialize() {
      if (!window.google || !mapRef.current || googleMapRef.current) {
        return;
      }

      const center = {
        lat: value.latitude ?? 28.6139,
        lng: value.longitude ?? 77.209,
      };
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: value.latitude !== null && value.longitude !== null ? 17 : 12,
        disableDefaultUI: true,
        zoomControl: true,
      });
      const marker = new window.google.maps.Marker({ position: center, map });

      map.addListener("click", (event) => {
        if (!event.latLng) {
          return;
        }

        const next = { latitude: event.latLng.lat(), longitude: event.latLng.lng() };
        marker.setPosition({ lat: next.latitude, lng: next.longitude });
        onChangeRef.current(next);
      });

      googleMapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    }

    if (window.google) {
      initialize();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("#park2bnb-google-maps");

    if (existingScript) {
      existingScript.addEventListener("load", initialize, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "park2bnb-google-maps";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.addEventListener("load", initialize, { once: true });
    document.head.appendChild(script);
  }, [key, onChange, value.latitude, value.longitude]);

  useEffect(() => {
    if (
      googleMapRef.current &&
      markerRef.current &&
      value.latitude !== null &&
      value.longitude !== null
    ) {
      const position = { lat: value.latitude, lng: value.longitude };
      googleMapRef.current.setCenter(position);
      markerRef.current.setPosition(position);
    }
  }, [value.latitude, value.longitude]);

  function useCurrentLocation() {
    setMessage("");

    if (!navigator.geolocation) {
      setMessage("Location is not available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setMessage("Current location captured.");
      },
      () => setMessage("Location permission was not granted."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  function geocodeAddress() {
    if (!address.trim()) {
      setMessage("Add an address first.");
      return;
    }

    if (!window.google) {
      setMessage("Google Maps key is needed to convert address to coordinates.");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      const location = results?.[0]?.geometry.location;

      if (status !== "OK" || !location) {
        setMessage("Could not find coordinates for this address.");
        return;
      }

      onChange({ latitude: location.lat(), longitude: location.lng() });
      setMessage("Address converted to coordinates.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <button className="btn-ghost" type="button" onClick={geocodeAddress}>
          Convert address
        </button>
        <button className="btn-secondary" type="button" onClick={useCurrentLocation}>
          Use my current location
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="label">Latitude</span>
          <input
            className="field"
            inputMode="decimal"
            value={value.latitude ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                latitude: event.target.value ? Number(event.target.value) : null,
              })
            }
            placeholder="28.6139"
          />
        </label>
        <label>
          <span className="label">Longitude</span>
          <input
            className="field"
            inputMode="decimal"
            value={value.longitude ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                longitude: event.target.value ? Number(event.target.value) : null,
              })
            }
            placeholder="77.2090"
          />
        </label>
      </div>

      <div className="h-64 overflow-hidden rounded-lg border border-[#dbe3df] bg-[#eef5f1]" ref={mapRef}>
        {!key && (
          <div className="grid h-full place-items-center p-5 text-center text-sm font-bold text-[#6b7772]">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map pin selection. Coordinates and current location still work.
          </div>
        )}
        {key && !mapReady && (
          <div className="grid h-full place-items-center p-5 text-center text-sm font-bold text-[#6b7772]">
            Loading map...
          </div>
        )}
      </div>

      {message && <p className="text-sm font-bold text-[#11614f]">{message}</p>}
    </div>
  );
}
