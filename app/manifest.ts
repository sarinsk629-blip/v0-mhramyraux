import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mharmyraux - Where Souls Collide",
    short_name: "Mharmyraux",
    description:
      "The end of the void. A global social ecosystem for real-time Human-to-Human connection. No AI. No bots. No algorithms.",
    start_url: "/",
    display: "standalone",
    background_color: "#020202",
    theme_color: "#7c3aed",
    orientation: "portrait",
    scope: "/",
    lang: "en",
    categories: ["social", "lifestyle", "entertainment"],
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "Mharmyraux Home - Where Souls Collide",
      },
      {
        src: "/screenshots/zenith.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "The Zenith - Find Love & Friendship",
      },
    ],
    shortcuts: [
      {
        name: "The Void",
        short_name: "Void",
        description: "Anonymous healing space",
        url: "/void",
        icons: [{ src: "/icons/void-icon.png", sizes: "96x96" }],
      },
      {
        name: "The Pulse",
        short_name: "Pulse",
        description: "Daily human interactions",
        url: "/pulse",
        icons: [{ src: "/icons/pulse-icon.png", sizes: "96x96" }],
      },
      {
        name: "The Zenith",
        short_name: "Zenith",
        description: "Find love and friendship",
        url: "/zenith",
        icons: [{ src: "/icons/zenith-icon.png", sizes: "96x96" }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
