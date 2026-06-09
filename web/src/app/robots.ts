import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/rejoindre", "/connexion", "/mentions-legales", "/confidentialite", "/cgu"],
        disallow: ["/dashboard", "/admin", "/profil", "/communaute", "/annuaire", "/masterclasses", "/challenges", "/evenements", "/offres", "/parrainage", "/ressources", "/support"],
      },
    ],
    sitemap: "https://propulsion.cnic.africa/sitemap.xml",
  };
}
