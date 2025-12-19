"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ParticleField } from "./particle-field"
import { ManifestoText } from "./manifesto-text"
import { GlobalCounter } from "./global-counter"
import { NavigationSpheres } from "./navigation-spheres"
import { EnergyCore } from "./energy-core"
import { WorldHeatmap } from "./world-heatmap"
import { SyncDropNotification } from "./sync-drop-notification"
import { EssenceShop } from "./essence-shop"
import { Global3DMap } from "./global-3d-map"
import { MoodSelector } from "./mood-selector"
import { createClient } from "@/lib/supabase/client"
import { getSoulMood, type SoulMood } from "@/lib/soul-identity"
import { Sparkles, ShoppingBag } from "lucide-react"

export function MharmyrauxPortal() {
  const [hasEntered, setHasEntered] = useState(false)
  const [soulInfo, setSoulInfo] = useState<{ id: string; name: string } | null>(null)
  const [showShop, setShowShop] = useState(false)
  const [syncDropActive, setSyncDropActive] = useState(false)
  const [currentMood, setCurrentMood] = useState<SoulMood>("neutral")
  const [impactPoints, setImpactPoints] = useState(0)

  useEffect(() => {
    setCurrentMood(getSoulMood())
  }, [])

  // Update last_seen periodically to maintain presence
  useEffect(() => {
    if (!soulInfo) return

    const supabase = createClient()

    const updatePresence = async () => {
      await supabase.from("souls").update({ last_seen: new Date().toISOString() }).eq("soul_id", soulInfo.id)

      const { data } = await supabase.from("souls").select("impact_points").eq("soul_id", soulInfo.id).single()

      if (data?.impact_points) setImpactPoints(data.impact_points)
    }

    updatePresence()
    const interval = setInterval(updatePresence, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [soulInfo])

  const handleEnter = (soulId: string, soulName: string) => {
    setSoulInfo({ id: soulId, name: soulName })
    setHasEntered(true)
  }

  const handleSyncDropActive = () => {
    setSyncDropActive(true)
    // Auto-hide map after 5 minutes
    setTimeout(() => setSyncDropActive(false), 5 * 60 * 1000)
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#020202" }}>
      <ParticleField />

      <SyncDropNotification onSyncDropActive={handleSyncDropActive} />

      <AnimatePresence>{syncDropActive && <Global3DMap isActive={syncDropActive} />}</AnimatePresence>

      <AnimatePresence mode="wait">
        {!hasEntered ? (
          <motion.div
            key="entry"
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-12"
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo */}
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-5xl md:text-7xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400"
              style={{
                textShadow: "0 0 60px rgba(16, 185, 129, 0.5)",
              }}
            >
              MHARMYRAUX
            </motion.h1>

            <ManifestoText />
            <GlobalCounter />
            <WorldHeatmap />
            <EnergyCore onEnter={handleEnter} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8"
          >
            {/* Welcome message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-zinc-500 text-sm uppercase tracking-[0.3em] mb-2">Welcome to the network</p>
              <h2
                className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400"
                style={{ textShadow: "0 0 30px rgba(16, 185, 129, 0.4)" }}
              >
                {soulInfo?.name}
              </h2>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <MoodSelector currentMood={currentMood} onMoodChange={setCurrentMood} />
            </motion.div>

            <GlobalCounter />
            <WorldHeatmap />
            <NavigationSpheres />

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={() => setShowShop(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="fixed top-4 right-4 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-500/50 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm">Essence Shop</span>
              <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-amber-500/20 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-mono text-amber-300">{impactPoints}</span>
              </div>
            </motion.button>

            {/* Soul ID display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="fixed bottom-4 left-4 text-xs text-zinc-700"
            >
              Soul ID: {soulInfo?.id}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <EssenceShop isOpen={showShop} onClose={() => setShowShop(false)} />
    </div>
  )
}
