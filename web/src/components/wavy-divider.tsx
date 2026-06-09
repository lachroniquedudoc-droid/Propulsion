import React from "react";

interface WavyDividerProps {
  className?: string;
  color?: string; // CSS color variable or hex
  layerColor?: string; // Optional second layered wave for parallax/depth effect
  height?: number; // Height in pixels
  inverted?: boolean;
}

export function WavyDivider({
  className = "",
  color = "var(--color-paper)",
  layerColor,
  height = 48,
  inverted = false,
}: WavyDividerProps) {
  return (
    <div
      className={`relative w-full overflow-hidden leading-[0] pointer-events-none select-none ${className} ${
        inverted ? "rotate-180" : ""
      }`}
      style={{ height: `${height}px` }}
    >
      {layerColor && (
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-40"
          style={{ fill: layerColor }}
        >
          <path d="M0,30 C300,90 900,120 1200,40 L1200,120 L0,120 Z" />
        </svg>
      )}
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block w-full h-full"
        style={{ fill: color }}
      >
        <path d="M0,50 C400,110 800,70 1200,90 L1200,120 L0,120 Z" />
      </svg>
    </div>
  );
}
