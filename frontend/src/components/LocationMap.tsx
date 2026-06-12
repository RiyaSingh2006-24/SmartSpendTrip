import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Crosshair, Maximize2, Minimize2, Navigation, Route, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface LocationMapMarker {
  lat: number;
  lon: number;
  title: string;
  description?: string;
  kind?: "destination" | "current" | "place";
}

interface LocationMapProps {
  markers: LocationMapMarker[];
  emptyMessage?: string;
  className?: string;
}

const defaultCenter: [number, number] = [22.9734, 78.6569];
const defaultZoom = 5;

const markerColor = (kind: LocationMapMarker["kind"]) => {
  if (kind === "current") {
    return "#2f6fed";
  }
  if (kind === "place") {
    return "#4d7c0f";
  }
  return "#cc6a3d";
};

const LocationMap = ({
  markers,
  emptyMessage = "Search for a destination to load the map.",
  className = "",
}: LocationMapProps) => {
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) {
      return;
    }

    layerGroup.clearLayers();

    const validMarkers = markers.filter(
      (marker) => Number.isFinite(marker.lat) && Number.isFinite(marker.lon),
    );

    if (!validMarkers.length) {
      map.setView(defaultCenter, defaultZoom);
      return;
    }

    const bounds = L.latLngBounds([]);

    validMarkers.forEach((marker) => {
      const latLng = L.latLng(marker.lat, marker.lon);
      bounds.extend(latLng);

      const circle = L.circleMarker(latLng, {
        radius: marker.kind === "destination" ? 10 : 8,
        color: "#ffffff",
        weight: 2,
        fillColor: markerColor(marker.kind),
        fillOpacity: 0.95,
      });

      const popupParts = [`<strong>${marker.title}</strong>`];
      if (marker.description) {
        popupParts.push(marker.description);
      }
      circle.bindPopup(popupParts.join("<br />"));
      circle.addTo(layerGroup);
    });

    if (validMarkers.length === 1) {
      map.setView(bounds.getCenter(), 11);
    } else {
      map.fitBounds(bounds.pad(0.2), { maxZoom: 11 });
    }
  }, [markers]);

  useEffect(() => {
    window.setTimeout(() => mapRef.current?.invalidateSize(), 120);
  }, [fullscreen]);

  return (
    <div
      className={`overflow-hidden border border-border bg-card shadow-sm transition-all ${
        fullscreen ? "fixed inset-4 z-[70] rounded-2xl" : "rounded-[1.5rem]"
      } ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Interactive Map</p>
          <h3 className="mt-2 font-heading text-2xl font-semibold">Destinations, attractions, restaurants, and routes</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Route", icon: Route },
            { label: "Nearby", icon: Search },
            { label: "Locate", icon: Crosshair },
          ].map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setFullscreen((value) => !value)}
            aria-label={fullscreen ? "Exit fullscreen map" : "Open fullscreen map"}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="relative">
        <div ref={containerRef} className={fullscreen ? "h-[calc(100vh-9rem)] w-full" : "h-[24rem] w-full"} />
        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
          {[
            ["Destination", "#cc6a3d"],
            ["Current", "#2f6fed"],
            ["Place", "#4d7c0f"],
          ].map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 hidden rounded-2xl bg-foreground/90 px-4 py-3 text-sm text-background shadow-xl md:block">
          <span className="inline-flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            Map updates when destination or nearby results change.
          </span>
        </div>
        {!markers.length ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-card/75 px-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
            {emptyMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default LocationMap;
