import type { Metadata } from "next"
import ZenithClient from "./zenith-client"

export const revalidate = 60

export const metadata: Metadata = {
  title: "The Zenith - Find Love & Friendship | Mharmyraux",
  description:
    "High-energy collisions for finding real love and friendship. Vibe-matched connections with 100% real humans. No bots, no algorithms.",
  openGraph: {
    title: "The Zenith - Find Love & Friendship",
    description: "High-energy human collisions. Find your match based on vibe frequency.",
    url: "https://mharmyraux.com/zenith",
    siteName: "Mharmyraux",
    images: [
      {
        url: "/og-zenith.jpg",
        width: 1200,
        height: 630,
        alt: "The Zenith - Where souls collide for love",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Zenith - Find Love & Friendship",
    description: "High-energy human collisions for finding your match.",
  },
}

export default function ZenithPage() {
  return <ZenithClient />
}
