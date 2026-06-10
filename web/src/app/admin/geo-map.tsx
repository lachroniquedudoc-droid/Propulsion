"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

// Standard ISO mapping with Lat/Lng coordinates for tooltip center
const COUNTRY_MAP: Record<string, { name: string; lat: number; lng: number }> = {
  "120": { name: "Cameroun", lat: 7.3697, lng: 12.3547 },
  "384": { name: "Côte d'Ivoire", lat: 7.5399, lng: -5.5471 },
  "686": { name: "Sénégal", lat: 14.4974, lng: -14.4524 },
  "768": { name: "Togo", lat: 8.6195, lng: 0.8248 },
  "204": { name: "Bénin", lat: 9.3077, lng: 2.3158 },
  "266": { name: "Gabon", lat: -0.8037, lng: 11.6094 },
  "178": { name: "Congo-Brazzaville", lat: -0.2280, lng: 15.8277 },
  "180": { name: "RDC", lat: -4.0383, lng: 21.7587 },
  "566": { name: "Nigeria", lat: 9.0820, lng: 8.6753 },
  "288": { name: "Ghana", lat: 7.9465, lng: -1.0232 },
  "466": { name: "Mali", lat: 17.5707, lng: -3.9962 },
  "854": { name: "Burkina Faso", lat: 12.2383, lng: -1.5616 },
  "324": { name: "Guinée", lat: 9.9456, lng: -9.6966 },
  "148": { name: "Tchad", lat: 15.4542, lng: 18.7322 },
  "646": { name: "Rwanda", lat: -1.9403, lng: 29.8739 },
  "250": { name: "France", lat: 46.2276, lng: 2.2137 },
  "56":  { name: "Belgique", lat: 50.5039, lng: 4.4699 },
  "124": { name: "Canada", lat: 56.1304, lng: -106.3468 },
  "826": { name: "Royaume-Uni", lat: 55.3781, lng: -3.4360 },
  "840": { name: "États-Unis", lat: 37.0902, lng: -95.7129 },
  "276": { name: "Allemagne", lat: 51.1657, lng: 10.4515 },
  "724": { name: "Espagne", lat: 40.4637, lng: -3.7492 },
  "380": { name: "Italie", lat: 41.8719, lng: 12.5674 },
  "528": { name: "Pays-Bas", lat: 52.1326, lng: 5.2913 },
  "756": { name: "Suisse", lat: 46.8182, lng: 8.2275 },
  "504": { name: "Maroc", lat: 31.7917, lng: -7.0926 },
  "788": { name: "Tunisie", lat: 33.8869, lng: 9.5375 },
  "784": { name: "Émirats Arabes Unis", lat: 23.4241, lng: 53.8478 },
};

// Numeric ISO to Alpha-3 ISO mapping
const ISO_NUM_TO_ALPHA3: Record<string, string> = {
  "120": "CMR", // Cameroun
  "384": "CIV", // Côte d'Ivoire
  "686": "SEN", // Sénégal
  "768": "TGO", // Togo
  "204": "BEN", // Bénin
  "266": "GAB", // Gabon
  "178": "COG", // Congo-Brazzaville
  "180": "COD", // RDC
  "566": "NGA", // Nigeria
  "288": "GHA", // Ghana
  "466": "MLI", // Mali
  "854": "BFA", // Burkina Faso
  "324": "GIN", // Guinée
  "148": "TCD", // Tchad
  "646": "RWA", // Rwanda
  "250": "FRA", // France
  "56":  "BEL", // Belgique
  "124": "CAN", // Canada
  "826": "GBR", // Royaume-Uni
  "840": "USA", // États-Unis
  "276": "DEU", // Allemagne
  "724": "ESP", // Espagne
  "380": "ITA", // Italie
  "528": "NLD", // Pays-Bas
  "756": "CHE", // Suisse
  "504": "MAR", // Maroc
  "788": "TUN", // Tunisie
  "784": "ARE", // Émirats Arabes Unis
};

// Function to generate the HSL choropleth colors
function getChoroplethColor(count: number, maxCount: number): string {
  if (count <= 0) return "#EAE8E3"; // Very light neutral grey/cream matching dashboard background
  
  const ratio = maxCount > 0 ? count / maxCount : 0;
  
  // Custom theme blue-gradient:
  // Base brand blue: HSL(216, 64%, 51%)
  const hue = 216;
  const saturation = Math.round(45 + ratio * 40); // 45% to 85%
  const lightness = Math.round(80 - ratio * 38);  // 80% (light blue) to 42% (rich dark blue)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function GeoMap({ data }: { data: Record<string, number> }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [geoJson, setGeoJson] = useState<any>(null);

  const maxCount = Math.max(1, ...Object.keys(data).map(k => ISO_NUM_TO_ALPHA3[k] ? data[k] : 0));

  // Fetch local countries GeoJSON boundaries
  useEffect(() => {
    fetch("/countries.geo.json")
      .then(res => res.json())
      .then(json => setGeoJson(json))
      .catch(err => console.error("Error loading GeoJSON:", err));
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!geoJson || !mapContainerRef.current) return;

    // Dynamically import Leaflet so it only runs in the browser
    import("leaflet").then((L) => {
      const container = mapContainerRef.current;
      if (!container) return;

      if (mapRef.current) {
        mapRef.current.remove();
      }

      // Initialize map
      const map = L.map(container, {
        center: [15, 10], // Centered roughly on Africa/Europe
        zoom: 2,
        minZoom: 1.5,
        maxZoom: 6,
        scrollWheelZoom: false,
        maxBounds: [[-65, -180], [85, 180]], // Restrict view bounds to prevent floating away
        maxBoundsViscosity: 1.0
      });

      mapRef.current = map;

      // Add a light background tile layer for visual context (CartoDB Positron without labels for a clean vector look)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(map);

      // Add choropleth GeoJSON layer
      L.geoJSON(geoJson, {
        style: (feature) => {
          const alpha3 = feature?.id;
          // Find matching numeric ISO from data mapping
          const isoNum = Object.keys(ISO_NUM_TO_ALPHA3).find(key => ISO_NUM_TO_ALPHA3[key] === alpha3);
          const count = isoNum ? (data[isoNum] || 0) : 0;
          const fillColor = getChoroplethColor(count, maxCount);

          return {
            fillColor: fillColor,
            weight: 1,
            opacity: 1,
            color: "#FFFFFF", // Border color
            fillOpacity: count > 0 ? 0.85 : 0.65,
          };
        },
        onEachFeature: (feature, layer) => {
          const alpha3 = feature?.id;
          const isoNum = Object.keys(ISO_NUM_TO_ALPHA3).find(key => ISO_NUM_TO_ALPHA3[key] === alpha3);
          const count = isoNum ? (data[isoNum] || 0) : 0;
          const countryNameFrench = isoNum ? COUNTRY_MAP[isoNum]?.name : null;
          const countryName = countryNameFrench || feature?.properties?.name || alpha3;

          layer.bindPopup(`
            <div style="font-family: system-ui, sans-serif; font-size: 12.5px; padding: 2px;">
              <strong style="color: #1A1A1A; font-size: 13.5px; display: block; margin-bottom: 2px;">${countryName}</strong>
              <span style="color: #2E6FD4; font-weight: bold; font-size: 13px;">
                ${count} membre${count > 1 ? "s" : ""}
              </span>
            </div>
          `);

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                fillOpacity: count > 0 ? 0.95 : 0.8,
                weight: 1.5,
                color: "#2E6FD4", // highlight border on hover
              });
              l.openPopup();
            },
            mouseout: (e) => {
              const l = e.target;
              l.setStyle({
                fillOpacity: count > 0 ? 0.85 : 0.65,
                weight: 1,
                color: "#FFFFFF",
              });
            },
            click: (e) => {
              map.fitBounds(e.target.getBounds(), { maxZoom: 4 });
            }
          });
        }
      }).addTo(map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [geoJson, data, maxCount]);

  return (
    <div className="relative w-full rounded-xl border border-[#E0DDD8] overflow-hidden bg-[#F4F3F0]" style={{ height: "450px" }}>
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-[#E0DDD8] bg-white p-3 z-[1000] shadow-sm pointer-events-none">
        <span className="text-[10px] font-sans font-bold text-[#6B6B6B] mb-1">Membres par pays</span>
        <div className="flex items-center gap-1">
          <span className="h-3 w-4 rounded-sm" style={{ backgroundColor: "#EAE8E3" }} />
          <span className="text-[9px] font-sans font-semibold text-[#8B8B8B]">0 membre</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="h-3 w-16 rounded-sm bg-gradient-to-r from-[hsl(216,45%,80%)] to-[hsl(216,85%,42%)]" />
          <span className="text-[9px] font-sans font-semibold text-[#8B8B8B]">1 +</span>
        </div>
      </div>
    </div>
  );
}
