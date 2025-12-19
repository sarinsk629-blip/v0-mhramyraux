"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface CountryData {
  country_code: string
  country_name: string
  count: number
}

// Simplified world map coordinates for major regions
const countryPositions: Record<string, { x: number; y: number }> = {
  US: { x: 20, y: 40 },
  CA: { x: 18, y: 30 },
  MX: { x: 18, y: 50 },
  BR: { x: 35, y: 65 },
  AR: { x: 30, y: 80 },
  GB: { x: 48, y: 32 },
  FR: { x: 50, y: 38 },
  DE: { x: 52, y: 35 },
  ES: { x: 47, y: 42 },
  IT: { x: 53, y: 42 },
  RU: { x: 70, y: 30 },
  CN: { x: 78, y: 42 },
  JP: { x: 88, y: 42 },
  KR: { x: 85, y: 42 },
  IN: { x: 72, y: 52 },
  AU: { x: 85, y: 75 },
  ZA: { x: 55, y: 75 },
  NG: { x: 52, y: 55 },
  EG: { x: 58, y: 48 },
  SA: { x: 62, y: 50 },
  AE: { x: 65, y: 52 },
  PK: { x: 68, y: 48 },
  ID: { x: 82, y: 60 },
  PH: { x: 85, y: 55 },
  VN: { x: 80, y: 52 },
  TH: { x: 78, y: 55 },
  MY: { x: 80, y: 58 },
  SG: { x: 80, y: 60 },
  NZ: { x: 92, y: 82 },
  SE: { x: 54, y: 25 },
  NO: { x: 52, y: 22 },
  FI: { x: 56, y: 22 },
  PL: { x: 55, y: 35 },
  NL: { x: 50, y: 34 },
  BE: { x: 49, y: 36 },
  CH: { x: 51, y: 38 },
  AT: { x: 54, y: 38 },
  PT: { x: 45, y: 42 },
  GR: { x: 56, y: 44 },
  TR: { x: 60, y: 42 },
  IL: { x: 60, y: 48 },
  XX: { x: 50, y: 50 },
}

export function WorldHeatmap() {
  const [countryData, setCountryData] = useState<CountryData[]>([])

  useEffect(() => {
    const supabase = createClient()

    const fetchCountryData = async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()

      const { data } = await supabase.from("souls").select("country_code, country_name").gte("last_seen", twoMinutesAgo)

      if (data) {
        // Aggregate by country
        const aggregated = data.reduce((acc: Record<string, CountryData>, soul) => {
          const code = soul.country_code || "XX"
          if (!acc[code]) {
            acc[code] = {
              country_code: code,
              country_name: soul.country_name || "Unknown",
              count: 0,
            }
          }
          acc[code].count++
          return acc
        }, {})

        setCountryData(Object.values(aggregated))
      }
    }

    fetchCountryData()

    // Subscribe to realtime changes
    const channel = supabase
      .channel("heatmap_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "souls" }, () => fetchCountryData())
      .subscribe()

    const interval = setInterval(fetchCountryData, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const maxCount = Math.max(...countryData.map((d) => d.count), 1)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 3.5 }}
      className="relative z-10 w-full max-w-4xl mx-auto"
    >
      <div className="text-center mb-4">
        <h3 className="text-sm text-zinc-500 uppercase tracking-[0.2em]">Live Global Presence</h3>
      </div>

      <div className="relative aspect-[2/1] bg-zinc-900/30 rounded-2xl border border-zinc-800/50 overflow-hidden backdrop-blur-sm">
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(10)].map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-zinc-500" style={{ top: `${(i + 1) * 10}%` }} />
          ))}
          {[...Array(10)].map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-zinc-500" style={{ left: `${(i + 1) * 10}%` }} />
          ))}
        </div>

        {/* Country hotspots */}
        {countryData.map((country) => {
          const pos = countryPositions[country.country_code] || countryPositions.XX
          const intensity = country.count / maxCount
          const size = 8 + intensity * 24

          return (
            <motion.div
              key={country.country_code}
              className="absolute group"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Pulse rings */}
              <motion.div
                className="absolute rounded-full bg-emerald-500/20"
                style={{
                  width: size * 3,
                  height: size * 3,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 2,
                }}
              />

              {/* Main dot */}
              <motion.div
                className="relative rounded-full"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle, 
                    rgba(16, 185, 129, ${0.6 + intensity * 0.4}) 0%, 
                    rgba(6, 182, 212, ${0.4 + intensity * 0.3}) 50%, 
                    transparent 100%)`,
                  boxShadow: `0 0 ${10 + intensity * 20}px rgba(16, 185, 129, ${0.5 + intensity * 0.5})`,
                }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random(),
                }}
              />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900/90 rounded text-xs text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {country.country_name}: {country.count} soul{country.count !== 1 ? "s" : ""}
              </div>
            </motion.div>
          )
        })}

        {/* No data message */}
        {countryData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-zinc-600 text-sm">Awaiting soul connections...</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
