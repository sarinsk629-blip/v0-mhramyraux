import type { Metadata } from "next"
import PulseClient from "./pulse-client"

export const revalidate = 60

export const metadata: Metadata = {
  title: "The Pulse - Daily Human Interactions | Mharmyraux",
  description:
    "A high-speed life-hub for daily human interactions. Gamify kindness with Impact Points. Connect with real humans and climb the leaderboard.",
  openGraph: {
    title: "The Pulse - Daily Human Interactions",
    description: "High-speed connections and gamified kindness. Earn Impact Points through real human interaction.",
    url: "https://mharmyraux.com/pulse",
    siteName: "Mharmyraux",
    images: [
      {
        url: "/og-pulse.jpg",
        width: 1200,
        height: 630,
        alt: "The Pulse - Daily human interactions hub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Pulse - Daily Human Interactions",
    description: "High-speed connections. Gamified kindness. Real humans only.",
  },
}

export default function PulsePage() {
  return <PulseClient />
}
