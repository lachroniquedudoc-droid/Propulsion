"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** délai en ms pour orchestrer une cascade */
  delay?: number;
  className?: string;
  /** balise de rendu (div par défaut) */
  as?: "div" | "section" | "li" | "article";
  /** direction de l'apparition */
  direction?: "up" | "left" | "right" | "zoom";
};

/**
 * Révèle son contenu avec un effet fluide (montée, glissement, zoom) quand il entre dans le viewport.
 * IntersectionObserver = aucun listener de scroll, 60fps, respecte
 * prefers-reduced-motion (géré en CSS).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  direction = "up",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal-${direction} ${visible ? "is-visible" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
