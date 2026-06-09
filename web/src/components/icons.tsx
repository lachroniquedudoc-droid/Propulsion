import type { SVGProps } from "react";

/**
 * Jeu d'icônes Propulsion — trait 1.5, currentColor, 24×24.
 * Inline SVG (zéro dépendance, léger, cohérent). Aucun emoji.
 */

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

/* ─── Icônes existantes ──────────────────────────────────────────── */

export function PlayCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Users(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.6" />
      <path d="M17 19a5.2 5.2 0 0 0-2.4-4.4" />
    </svg>
  );
}

export function Card(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M7 14.5h4" />
    </svg>
  );
}

export function Spark(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c.4 3.8 1.7 5.1 5.5 5.5C13.7 8.9 12.4 10.2 12 14c-.4-3.8-1.7-5.1-5.5-5.5C10.3 8.1 11.6 6.8 12 3z" />
      <path d="M18.5 14.5c.2 1.7.8 2.3 2.5 2.5-1.7.2-2.3.8-2.5 2.5-.2-1.7-.8-2.3-2.5-2.5 1.7-.2 2.3-.8 2.5-2.5z" />
    </svg>
  );
}

export function Trophy(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5.5H4.5A2.5 2.5 0 0 0 7 9.5M17 5.5h2.5A2.5 2.5 0 0 1 17 9.5" />
      <path d="M12 13v3M9 20h6M10 20l.5-4M14 20l-.5-4" />
    </svg>
  );
}

export function Share(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <path d="M8.2 10.8l6.6-3.6M8.2 13.2l6.6 3.6" />
    </svg>
  );
}

export function Shield(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7 2.5v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V5.5L12 3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function Bell(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1 5 1.5 6h-15C5 15 6 14 6 10z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function Check(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Star(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M12 4l2.3 4.8 5.2.7-3.8 3.6.9 5.1L12 15.8 7.4 18.2l.9-5.1L4.5 9.5l5.2-.7L12 4z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function Menu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Close(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Logo(props: IconProps) {
  return (
    <svg
      width={28}
      height={28}
      viewBox="0 0 28 28"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path
        d="M6 17.5L14 8l8 9.5"
        stroke="var(--color-brand, #3871c2)"
        strokeWidth={2.6}
      />
      <path
        d="M6 22l8-5.2L22 22"
        stroke="var(--color-gold, #ffac42)"
        strokeWidth={2.6}
      />
    </svg>
  );
}

/**
 * Mark Propulsion — 5 figures en cercle (reproduction fidèle du logo).
 * `mono` passe tout en `currentColor` pour les fonds colorés.
 */
export function PropulsionMark({
  mono = false,
  width = 40,
  height = 40,
  className,
  style,
}: IconProps & { mono?: boolean }) {
  const c = mono
    ? (["currentColor", "currentColor", "currentColor", "currentColor", "currentColor"] as const)
    : (["#766391", "#1a1a1a", "#3871c2", "#ff1e58", "#ffac42"] as const);
  // Ordre clockwise depuis le haut : purple, dark, blue, red, orange
  return (
    <svg width={width} height={height} viewBox="0 0 40 40" fill="none" className={className} style={style}>
      {c.map((color, i) => (
        <g key={i} transform={`rotate(${i * 72}, 20, 20)`}>
          {/* Tête — cercle à l'extrémité externe */}
          <circle cx="20" cy="7.5" r="3.3" fill={color} />
          {/* Corps — forme en larme se rétrécissant vers le centre */}
          <path
            d="M20 10.5 Q24.5 13.5 23 17.5 Q20 19 17 17.5 Q15.5 13.5 20 10.5Z"
            fill={color}
          />
        </g>
      ))}
    </svg>
  );
}

/* ─── Nouvelles icônes dashboard ─────────────────────────────────── */

/** Fil d'actualité / messagerie communauté */
export function MessageSquare(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Ticket / événement */
export function Ticket(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V9z" />
      <path d="M9 12h6M9 15h4" />
    </svg>
  );
}

/** Marché / offres business */
export function Briefcase(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="7" width="20" height="14" rx="2.5" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M12 12v.01M2 12h20" />
    </svg>
  );
}

/** Vidéo / masterclasses */
export function VideoPlay(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Wallet / parrainage & gains */
export function Wallet(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M2 11h20" />
      <circle cx="17" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <path d="M16 7V5a2 2 0 0 0-2-2H6" />
    </svg>
  );
}

/** Dossier / ressources */
export function FolderOpen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path d="M3 12l3-3h12l-2 7H4l-1-4z" />
    </svg>
  );
}

/** Aide / support */
export function HelpCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.8 2.8 0 0 1 5.2 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Couronne / admin */
export function Crown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 17l2-8 4.5 4.5L12 6l2.5 7.5L19 9l2 8H3z" />
      <path d="M3 20h18" />
    </svg>
  );
}

/** Calendrier / événements */
export function Calendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}

/** Annuaire / répertoire */
export function BookUser(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M8 16a4 4 0 0 1 8 0" />
    </svg>
  );
}

/** Sprint / flash challenge */
export function Zap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 2L4.5 13.5H12L11 22l8.5-11.5H13L13 2z" />
    </svg>
  );
}

/** Accueil / dashboard */
export function Home(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12.5L12 4l9 8.5" />
      <path d="M5 11v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

/** Cœur / like */
export function Heart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/** Bulle de commentaire */
export function MessageCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

/** Localisation / pin */
export function MapPin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Recherche */
export function Search(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

/** Plus / ajouter */
export function Plus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Filtre */
export function Filter(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

/** Flèche haut-droite / lien externe */
export function ExternalLink(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/** Appareil photo */
export function Camera(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function Settings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Trash(props: IconProps) {
  return (
    <svg {...base(props)}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function BookOpen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export function UserCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function Eye(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
