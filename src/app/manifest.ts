import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AZPO Estate — недвижимость в Турции",
    short_name: "AZPO Estate",
    start_url: "/ru/",
    display: "standalone",
    background_color: "#edf4fc",
    theme_color: "#2e5a90",
    icons: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
  };
}
