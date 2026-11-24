import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Umbral — red de reputación",
    short_name: "Umbral",
    description:
      "Cada interacción termina en una calificación. Tu promedio ponderado decide a dónde puedes entrar.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08080b",
    theme_color: "#08080b",
    lang: "es",
    categories: ["social"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Mi número", url: "/settings" },
      { name: "Calificar", url: "/rate" },
    ],
  };
}
