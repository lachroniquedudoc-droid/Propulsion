import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Propulsion — La communauté des entrepreneurs panafricains", template: "%s — Propulsion" },
  description:
    "Adhésions, masterclasses, networking, paiements et accompagnement — toute la communauté Propulsion réunie en un seul endroit, fluide et pensé pour l'Afrique.",
  applicationName: "Propulsion",
  authors: [{ name: "CNIC · Dr Claudel Noubissie" }],
  keywords: ["entrepreneuriat Afrique", "communauté entrepreneurs Cameroun", "masterclass business Afrique", "networking panafricain", "CNIC Propulsion"],
  metadataBase: new URL("https://propulsion.cnic.africa"),
  openGraph: {
    title: "Propulsion — La communauté des entrepreneurs panafricains",
    description: "Masterclasses, networking, challenges et accompagnement business — rejoins les entrepreneurs qui agissent en Afrique.",
    url: "https://propulsion.cnic.africa",
    siteName: "Propulsion",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Propulsion — Communauté entrepreneuriale panafricaine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Propulsion — La communauté des entrepreneurs panafricains",
    description: "Masterclasses, networking et challenges — rejoins les entrepreneurs qui agissent en Afrique.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#3871c2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${outfit.variable} ${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
