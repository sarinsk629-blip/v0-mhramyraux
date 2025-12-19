"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface ActiveUser {
  soul_id: string
  soul_name: string
  latitude: number
  longitude: number
  vibe_frequency: number
  status: string
}

interface ResonanceGridProps {
  sphere: "void" | "pulse" | "zenith"
  onUserCount?: (count: number) => void
}

export function ResonanceGrid({ sphere, onUserCount }: ResonanceGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [users, setUsers] = useState<ActiveUser[]>([])
  const animationRef = useRef<number>()
  const supabase = createClient()

  // Fetch and subscribe to presence
  useEffect(() => {
    const fetchPresence = async () => {
      const { data } = await supabase.from("presence").select("*").eq("sphere", sphere).eq("status", "active")

      if (data) {
        setUsers(data as ActiveUser[])
        onUserCount?.(data.length)
      }
    }

    fetchPresence()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`presence_${sphere}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "presence", filter: `sphere=eq.${sphere}` },
        () => {
          fetchPresence()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sphere, onUserCount, supabase])

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Particle system for each user
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      frequency: number
      phase: number
      color: string
    }> = []

    // Generate particles for users
    users.forEach((user, i) => {
      const angle = (i / users.length) * Math.PI * 2
      const radius = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.3
      particles.push({
        x: canvas.offsetWidth / 2 + Math.cos(angle) * radius,
        y: canvas.offsetHeight / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        frequency: user.vibe_frequency,
        phase: Math.random() * Math.PI * 2,
        color: getColorForSphere(sphere, user.vibe_frequency),
      })
    })

    // Add ambient particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        frequency: Math.random(),
        phase: Math.random() * Math.PI * 2,
        color: `rgba(255, 255, 255, 0.1)`,
      })
    }

    let time = 0
    const animate = () => {
      ctx.fillStyle = "rgba(2, 2, 2, 0.1)"
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      time += 0.016

      particles.forEach((p, i) => {
        // Update position
        p.x += p.vx + Math.sin(time + p.phase) * 0.5
        p.y += p.vy + Math.cos(time + p.phase) * 0.5

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1

        // Draw energy waveform
        const waveAmplitude = 20 + p.frequency * 30
        const waveFreq = 0.1 + p.frequency * 0.2

        ctx.beginPath()
        ctx.strokeStyle = p.color
        ctx.lineWidth = 2

        for (let j = 0; j < 50; j++) {
          const wx = p.x + j * 3 - 75
          const wy = p.y + Math.sin(j * waveFreq + time * 2 + p.phase) * waveAmplitude
          if (j === 0) ctx.moveTo(wx, wy)
          else ctx.lineTo(wx, wy)
        }
        ctx.stroke()

        // Draw center point
        ctx.beginPath()
        const pulseSize = 4 + Math.sin(time * 3 + p.phase) * 2
        ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()

        // Draw connections between nearby particles
        particles.slice(i + 1).forEach((p2) => {
          const dx = p2.x - p.x
          const dy = p2.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 150) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 150)})`
            ctx.lineWidth = 1
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [users, sphere])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" style={{ background: "#020202" }} />

      {/* User count overlay */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-zinc-800">
        <span className="text-zinc-400 text-sm">Souls Online: </span>
        <span className="text-white font-bold">{users.length}</span>
      </div>
    </motion.div>
  )
}

function getColorForSphere(sphere: string, frequency: number): string {
  const alpha = 0.6 + frequency * 0.4
  switch (sphere) {
    case "void":
      return `rgba(128, 90, 213, ${alpha})` // Purple for void
    case "pulse":
      return `rgba(244, 63, 94, ${alpha})` // Rose for pulse
    case "zenith":
      return `rgba(251, 191, 36, ${alpha})` // Amber for zenith
    default:
      return `rgba(255, 255, 255, ${alpha})`
  }
}
