import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lost Garden",
    short_name: "Lost Garden",
    description:
      "Poetic dark fantasy anime by Frank Houbre. A hollow knight, a mysterious child, and a world beneath the earth.",
    start_url: "/",
    display: "standalone",
    background_color: "#020817",
    theme_color: "#020817",
    categories: ["entertainment", "anime", "animation"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
