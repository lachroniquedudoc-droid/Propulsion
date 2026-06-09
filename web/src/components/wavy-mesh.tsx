"use client";

import React, { useMemo } from "react";

export function WavyMeshBackground({ className = "" }: { className?: string }) {
  const dots = useMemo(() => {
    const width = 1200;
    const height = 700;
    const temp = [];

    // 1. Top-Right Halftone Wave Grid (Concentric undulating arcs)
    const colsTR = 75;
    const rowsTR = 32;
    const maxRadiusTR = 680;

    for (let col = 0; col < colsTR; col++) {
      for (let row = 0; row < rowsTR; row++) {
        const u = col / (colsTR - 1);
        const v = row / (rowsTR - 1);

        const angle = u * (Math.PI / 2); // 0 to 90 degrees
        const baseRadius = v * maxRadiusTR;
        
        // Undulating ripple deformation following wave curvature
        const wave = Math.sin(u * Math.PI * 5.5 - v * Math.PI * 2.5) * 16.0;
        const currentRadius = baseRadius + wave;

        if (currentRadius > 0 && currentRadius <= maxRadiusTR) {
          const px = parseFloat((width - Math.cos(angle) * currentRadius).toFixed(2));
          const py = parseFloat((Math.sin(angle) * currentRadius).toFixed(2));

          const factor = 1.0 - (currentRadius / maxRadiusTR);
          const radius = parseFloat((0.6 + factor * 1.6).toFixed(2)); // Refined sizing: 0.6px to 2.2px
          const opacity = parseFloat((0.02 + factor * 0.12).toFixed(3)); // Ultra-soft opacity: 0.02 to 0.14

          temp.push(
            <circle
              key={`tr-${col}-${row}`}
              cx={px}
              cy={py}
              r={radius}
              fill="#8A8880"
              opacity={opacity}
            />
          );
        }
      }
    }

    // 2. Bottom-Left Halftone Wave Grid (Concentric undulating arcs)
    const colsBL = 75;
    const rowsBL = 32;
    const maxRadiusBL = 680;

    for (let col = 0; col < colsBL; col++) {
      for (let row = 0; row < rowsBL; row++) {
        const u = col / (colsBL - 1);
        const v = row / (rowsBL - 1);

        const angle = u * (Math.PI / 2); // 0 to 90 degrees
        const baseRadius = v * maxRadiusBL;
        
        // Undulating ripple deformation following wave curvature
        const wave = Math.sin(u * Math.PI * 5.5 - v * Math.PI * 2.5) * 16.0;
        const currentRadius = baseRadius + wave;

        if (currentRadius > 0 && currentRadius <= maxRadiusBL) {
          const px = parseFloat((Math.cos(angle) * currentRadius).toFixed(2));
          const py = parseFloat((height - Math.sin(angle) * currentRadius).toFixed(2));

          const factor = 1.0 - (currentRadius / maxRadiusBL);
          const radius = parseFloat((0.6 + factor * 1.6).toFixed(2)); // Refined sizing: 0.6px to 2.2px
          const opacity = parseFloat((0.02 + factor * 0.12).toFixed(3)); // Ultra-soft opacity: 0.02 to 0.14

          temp.push(
            <circle
              key={`bl-${col}-${row}`}
              cx={px}
              cy={py}
              r={radius}
              fill="#8A8880"
              opacity={opacity}
            />
          );
        }
      }
    }

    return temp;
  }, []);

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 ${className}`}
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {dots}
    </svg>
  );
}
