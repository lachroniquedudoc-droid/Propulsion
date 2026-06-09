"use client";

import { useEffect, useRef } from "react";

/* Palette RGB — 5 couleurs officielles du logo Propulsion */
const PALETTE: [number, number, number][] = [
  [56,  113, 194],  /* bleu royal  */
  [118, 99,  145],  /* violet      */
  [255, 172, 66],   /* or          */
  [255, 30,  88],   /* rouge/rose  */
  [26,  26,  26],   /* noir figure */
];

interface Dot {
  x: number; y: number;
  ox: number; oy: number;   /* origine pour le retour élastique */
  vx: number; vy: number;
  r: number;
  rgb: [number, number, number];
  a: number;
}

/**
 * Champ de particules interactif — dots de marque qui s'écartent au survol
 * et reviennent élastiquement à leur position d'origine.
 * Canvas, 60 fps, pointer-events: none (ne bloque pas le contenu).
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const mouse = { x: -9999, y: -9999 };
    let dots: Dot[] = [];

    /* ── Taille canvas = taille du parent ── */
    const resize = () => {
      const p = canvas.parentElement;
      if (!p) return;
      canvas.width  = p.offsetWidth;
      canvas.height = p.offsetHeight;
      dots = makeDots(canvas.width, canvas.height);
    };

    const makeDots = (w: number, h: number): Dot[] => {
      const n = Math.min(Math.floor(w * h / 8500), 230);
      return Array.from({ length: n }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x, y, ox: x, oy: y,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.7 + 0.6,
          rgb: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          a: Math.random() * 0.32 + 0.1,
        };
      });
    };

    /* ── Suivi souris sur toute la fenêtre pour traverser le contenu ── */
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };

    const REPEL = 130; /* rayon de répulsion en px */

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < REPEL * REPEL && d2 > 0) {
          const dist = Math.sqrt(d2);
          const force = ((REPEL - dist) / REPEL) * 3.8;
          d.vx += (dx / dist) * force * 0.09;
          d.vy += (dy / dist) * force * 0.09;
        }

        /* rappel élastique vers l'origine + amortissement */
        d.vx += (d.ox - d.x) * 0.024;
        d.vy += (d.oy - d.y) * 0.024;
        d.vx *= 0.84;
        d.vy *= 0.84;
        d.x  += d.vx;
        d.y  += d.vy;

        const [r, g, b] = d.rgb;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${d.a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
