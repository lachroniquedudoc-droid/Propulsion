import type { MetadataRoute } from "next";

const BASE = "https://propulsion.cnic.africa";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                        lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/rejoindre`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/connexion`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE}/mentions-legales`,  lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/confidentialite`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/cgu`,               lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ];
}
