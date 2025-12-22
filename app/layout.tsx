import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Mharmyraux - Where Souls Collide",
  description:
    "The end of the void. A revolutionary global social ecosystem for real-time Human-to-Human connection. No AI chatbots. No bots. No algorithms. Just real souls colliding across the digital cosmos. Join millions finding authentic human connection.",
  keywords: [
    "social network",
    "human connection",
    "real-time chat",
    "global community",
    "no bots",
    "authentic connections",
    "soul matching",
    "human only",
    "anti-algorithm",
    "real people",
  ],
  authors: [{ name: "Mharmyraux" }],
  creator: "Mharmyraux",
  publisher: "Mharmyraux",
  verification: {
    google: "ettceV2fs9TnQV7bqXvT03Q1FFH9pNu2BxqjUDwKDMc",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mharmyraux.com",
    siteName: "Mharmyraux",
    title: "Mharmyraux - Where Souls Collide",
    description:
      "The end of the void. Join the revolution of real human connection. No AI. No bots. No algorithms. Just souls colliding across the cosmos.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mharmyraux - Where Souls Collide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mharmyraux - Where Souls Collide",
    description: "The end of the void. Real human connection without AI, bots, or algorithms.",
    images: ["/og-image.jpg"],
    creator: "@mharmyraux",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL("https://mharmyraux.com"),
  alternates: {
    canonical: "/",
  },
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#020202",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
