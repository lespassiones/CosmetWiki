import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CosmetWiki — Décrypte tes cosmétiques",
    short_name: "CosmetWiki",
    description:
      "Analyse INCI : tape un nom de produit ou colle sa liste d'ingrédients, on note la composition sur 20.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAFA",
    theme_color: "#F43F5E",
    lang: "fr-FR",
    categories: ["health", "lifestyle", "utilities"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
