import type { Metadata } from "next"
import VoidClient from "./void-client"
import { JsonLd } from "@/components/json-ld"

export const revalidate = 60

export const metadata: Metadata = {
  title: "The Void - Anonymous Healing Space | Mharmyraux",
  description:
    "An anonymous healing room for real humans in pain. Protected by AI Guardian for safety. Find solace with kindred souls. No bots, no algorithms.",
  openGraph: {
    title: "The Void - Anonymous Healing Space",
    description: "A safe, anonymous space for real humans seeking solace and connection.",
    url: "https://mharmyraux.com/void",
    siteName: "Mharmyraux",
    images: [
      {
        url: "/og-void.jpg",
        width: 1200,
        height: 630,
        alt: "The Void - Anonymous healing space",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Void - Anonymous Healing Space",
    description: "Safe, anonymous connections for real humans seeking solace.",
  },
}

export default function VoidPage() {
  return (
    <>
      <JsonLd pageType="sphere" sphereName="Void" />
      <VoidClient />
    </>
  )
}
