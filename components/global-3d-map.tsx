"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface Soul {
  id: string
  soul_id: string
  soul_name: string
  latitude: number
  longitude: number
  aura_type?: string
  is_shadow_banned?: boolean
  current_mood?: string
}

interface Global3DMapProps {
  isActive: boolean
}

// Aura colors for different types
const auraColors: Record<string, string> = {
  basic: "#a78bfa",
  ethereal: "#818cf8",
  cosmic: "#60a5fa",
  phoenix: "#f97316",
  void_master: "#374151",
  zenith_legend: "#fbbf24",
}

export function Global3DMap({ isActive }: Global3DMapProps) {
  const [souls, setSouls] = useState<Soul[]>([])
  const [rotation, setRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supabase = createClient()

  // Fetch all visible souls during sync drop
  useEffect(() => {
    if (!isActive) return

    const fetchSouls = async () => {
      const { data } = await supabase
        .from("presence")
        .select(`
          id,
          soul_id,
          soul_name,
          latitude,
          longitude
        `)
        .eq("status", "active")

      // Also get soul details for aura info
      if (data && data.length > 0) {
        const soulIds = data.map((s) => s.soul_id)
        const { data: soulDetails } = await supabase
          .from("souls")
          .select("soul_id, aura_type, is_shadow_banned, current_mood")
          .in("soul_id", soulIds)

        const detailsMap = new Map(soulDetails?.map((s) => [s.soul_id, s]))

        const enrichedSouls = data.map((soul) => ({
          ...soul,
          ...(detailsMap.get(soul.soul_id) || {}),
        }))

        setSouls(enrichedSouls)
      }
    }

    fetchSouls()
    const interval = setInterval(fetchSouls, 5000)
    return () => clearInterval(interval)
  }, [isActive, supabase])

  // Rotation animation
  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      setRotation((r) => (r + 0.2) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [isActive])

  // Convert lat/lng to 3D sphere coordinates
  const projectToSphere = (lat: number, lng: number, radius: number) => {
    const latRad = (lat * Math.PI) / 180
    const lngRad = ((lng + rotation) * Math.PI) / 180

    const x = radius * Math.cos(latRad) * Math.sin(lngRad)
    const y = radius * Math.sin(latRad)
    const z = radius * Math.cos(latRad) * Math.cos(lngRad)

    return { x, y, z }
  }

  // Draw the 3D globe
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isActive) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.35

    // Clear
    ctx.fillStyle = "#020202"
    ctx.fillRect(0, 0, width, height)

    // Draw globe outline with gradient
    const globeGradient = ctx.createRadialGradient(centerX - 30, centerY - 30, 0, centerX, centerY, radius * 1.2)
    globeGradient.addColorStop(0, "rgba(55, 65, 81, 0.3)")
    globeGradient.addColorStop(0.5, "rgba(31, 41, 55, 0.2)")
    globeGradient.addColorStop(1, "rgba(17, 24, 39, 0.1)")

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = globeGradient
    ctx.fill()
    ctx.strokeStyle = "rgba(75, 85, 99, 0.5)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw latitude lines
    ctx.strokeStyle = "rgba(75, 85, 99, 0.2)"
    ctx.lineWidth = 1
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath()
      const latRadius = radius * Math.cos((lat * Math.PI) / 180)
      const latY = centerY - radius * Math.sin((lat * Math.PI) / 180)
      ctx.ellipse(centerX, latY, latRadius, latRadius * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw longitude lines
    for (let lng = 0; lng < 180; lng += 30) {
      ctx.beginPath()
      const lngRad = ((lng + rotation) * Math.PI) / 180
      ctx.ellipse(centerX, centerY, radius * Math.abs(Math.sin(lngRad)), radius, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Sort souls by z-depth for proper rendering
    const projectedSouls = souls
      .map((soul) => {
        const lat = soul.latitude || Math.random() * 180 - 90
        const lng = soul.longitude || Math.random() * 360 - 180
        const pos = projectToSphere(lat, lng, radius)
        return { soul, pos }
      })
      .sort((a, b) => a.pos.z - b.pos.z)

    // Draw souls
    projectedSouls.forEach(({ soul, pos }) => {
      // Only draw if on visible side (z > 0)
      if (pos.z < -radius * 0.2) return

      const screenX = centerX + pos.x
      const screenY = centerY - pos.y

      // Size based on depth
      const depthFactor = (pos.z + radius) / (2 * radius)
      const baseSize = 4 + depthFactor * 8
      const opacity = 0.3 + depthFactor * 0.7

      // Get aura color
      let color = auraColors[soul.aura_type || "basic"] || auraColors.basic
      if (soul.is_shadow_banned) {
        color = "#6b7280" // Grey for shadow banned
      }

      // Draw glow
      const glowGradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, baseSize * 3)
      glowGradient.addColorStop(
        0,
        `${color}${Math.floor(opacity * 80)
          .toString(16)
          .padStart(2, "0")}`,
      )
      glowGradient.addColorStop(1, "transparent")
      ctx.beginPath()
      ctx.arc(screenX, screenY, baseSize * 3, 0, Math.PI * 2)
      ctx.fillStyle = glowGradient
      ctx.fill()

      // Draw core
      ctx.beginPath()
      ctx.arc(screenX, screenY, baseSize, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = opacity
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Draw soul count
    ctx.font = "bold 14px sans-serif"
    ctx.fillStyle = "#fbbf24"
    ctx.textAlign = "center"
    ctx.fillText(`${souls.length} souls visible`, centerX, height - 20)
  }, [souls, rotation, isActive])

  if (!isActive) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <div className="relative">
        {/* Animated rings */}
        <motion.div
          className="absolute inset-0 rounded-full border border-amber-500/20"
          style={{ transform: "scale(1.5)" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-amber-500/10"
          style={{ transform: "scale(2)" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />

        <canvas ref={canvasRef} width={600} height={600} className="rounded-full" />

        {/* Legend */}
        <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-violet-400" />
            <span className="text-zinc-400">Basic</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-zinc-400">Legendary</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-zinc-500" />
            <span className="text-zinc-400">Shadow</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
