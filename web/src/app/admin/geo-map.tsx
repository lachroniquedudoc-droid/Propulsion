"use client";

import { useEffect, useState, useRef } from "react";

const ISO_NUM_TO_ALPHA3: Record<string, string> = {
  "120": "CMR", "384": "CIV", "686": "SEN", "768": "TGO",
  "204": "BEN", "266": "GAB", "178": "COG", "180": "COD",
  "566": "NGA", "288": "GHA", "466": "MLI", "854": "BFA",
  "324": "GIN", "148": "TCD", "646": "RWA", "250": "FRA",
  "56":  "BEL", "124": "CAN", "826": "GBR", "840": "USA",
  "276": "DEU", "724": "ESP", "380": "ITA", "528": "NLD",
  "756": "CHE", "504": "MAR", "788": "TUN", "784": "ARE",
};

const ALPHA3_TO_NAME: Record<string, string> = {
  CMR: "Cameroun", CIV: "Côte d'Ivoire", SEN: "Sénégal", TGO: "Togo",
  BEN: "Bénin", GAB: "Gabon", COG: "Congo-Brazzaville", COD: "RDC",
  NGA: "Nigeria", GHA: "Ghana", MLI: "Mali", BFA: "Burkina Faso",
  GIN: "Guinée", TCD: "Tchad", RWA: "Rwanda", FRA: "France",
  BEL: "Belgique", CAN: "Canada", GBR: "Royaume-Uni", USA: "États-Unis",
  DEU: "Allemagne", ESP: "Espagne", ITA: "Italie", NLD: "Pays-Bas",
  CHE: "Suisse", MAR: "Maroc", TUN: "Tunisie", ARE: "Émirats Arabes Unis",
};

// Build a reverse lookup: alpha3 → count
function buildCountsMap(data: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [isoNum, count] of Object.entries(data)) {
    const a3 = ISO_NUM_TO_ALPHA3[isoNum];
    if (a3) out[a3] = count;
  }
  return out;
}

function choroplethColor(count: number, max: number): string {
  if (count <= 0) return "#E8E5DF";
  const t = max > 0 ? count / max : 0;
  const h = 216;
  const s = Math.round(45 + t * 40);
  const l = Math.round(80 - t * 38);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Simple equirectangular projection
const W = 900, H = 460;
function project(lng: number, lat: number): [number, number] {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

function ringToD(coords: number[][]): string {
  return coords.map(([lng, lat], i) => {
    const [x, y] = project(lng, lat);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

function featureToPath(geometry: any): string {
  if (!geometry) return "";
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToD).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((poly: number[][][]) => poly.map(ringToD).join(" "))
      .join(" ");
  }
  return "";
}

type Tooltip = { x: number; y: number; name: string; count: number } | null;

export function GeoMap({ data }: { data: Record<string, number> }) {
  const [features, setFeatures] = useState<any[]>([]);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const counts = buildCountsMap(data);
  const maxCount = Math.max(1, ...Object.values(counts));

  useEffect(() => {
    fetch("/countries.geo.json")
      .then(r => r.json())
      .then(json => setFeatures(json.features ?? []))
      .catch(() => {});
  }, []);

  function handleMouseMove(e: React.MouseEvent<SVGPathElement>, alpha3: string) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const name = ALPHA3_TO_NAME[alpha3] ?? alpha3;
    const count = counts[alpha3] ?? 0;
    setTooltip({ x, y, name, count });
  }

  return (
    <div className="relative w-full rounded-xl border border-[#E0DDD8] overflow-hidden bg-[#F0EEE9]"
         style={{ aspectRatio: `${W}/${H}` }}>

      {features.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#2E6FD4] border-t-transparent"/>
        </div>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full"
          onMouseLeave={() => setTooltip(null)}
        >
          {features.map((f) => {
            const a3 = f.id as string;
            const count = counts[a3] ?? 0;
            const fill = choroplethColor(count, maxCount);
            const d = featureToPath(f.geometry);
            if (!d) return null;
            return (
              <path
                key={a3}
                d={d}
                fill={fill}
                stroke="#fff"
                strokeWidth={0.4}
                className="cursor-default transition-opacity hover:opacity-80"
                onMouseMove={(e) => handleMouseMove(e, a3)}
              />
            );
          })}
        </svg>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-[#E0DDD8] bg-white px-3 py-2 shadow-md"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <p className="text-[12.5px] font-bold text-[#1A1A1A] font-sans">{tooltip.name}</p>
          <p className="text-[12px] font-semibold text-[#2E6FD4] font-sans">
            {tooltip.count} membre{tooltip.count !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1 rounded-lg border border-[#E0DDD8] bg-white px-3 py-2 shadow-sm pointer-events-none">
        <span className="text-[9.5px] font-sans font-bold text-[#6B6B6B] uppercase tracking-wide">Membres par pays</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: "#E8E5DF" }}/>
          <span className="text-[9px] font-sans text-[#8B8B8B]">0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-16 rounded-sm bg-gradient-to-r from-[hsl(216,45%,80%)] to-[hsl(216,85%,42%)]"/>
          <span className="text-[9px] font-sans text-[#8B8B8B]">1+</span>
        </div>
      </div>
    </div>
  );
}
