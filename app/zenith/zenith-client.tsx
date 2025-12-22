"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ResonanceGrid } from "@/components/resonance-grid"
import { SyncButton } from "@/components/sync-button"
import { TransparencyChat } from "@/components/transparency-chat"
import { ImpactPointsDisplay } from "@/components/impact-points-display"
import { SyncDropNotification } from "@/components/sync-drop-notification"
import { Global3DMap } from "@/components/global-3d-map"
import { EssenceShop } from "@/components/essence-shop"
import { MoodSelector } from "@/components/mood-selector"
import { createClient } from "@/lib/supabase/client"
import { generateSoulId, getSoulName, generateVibeFrequency, getSoulMood, type SoulMood } from "@/lib/soul-identity"
import { ArrowLeft, Sun, Sparkles, Heart, Star, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function ZenithClient() {
  const [activeChat, setActiveChat] = useState<{
    roomId: string
    matchedSoul: { name: string; matchScore: number }
  } | null>(null)
  const [userCount, setUserCount] = useState(0)
  const [recentCollisions, setRecentCollisions] = useState(0)
  const [syncDropActive, setSyncDropActive] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [currentMood, setCurrentMood] = useState<SoulMood>("neutral")
  const [impactPoints, setImpactPoints] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const soulId = generateSoulId()
    const soulName = getSoulName()
    setCurrentMood(getSoulMood())

    const registerPresence = async () => {
      await supabase.from("presence").upsert(
        {
          soul_id: soulId,
          soul_name: soulName,
          sphere: "zenith",
          vibe_frequency: generateVibeFrequency(),
          status: "active",
          last_ping: new Date().toISOString(),
        },
        { onConflict: "soul_id" },
      )

      const { data } = await supabase.from("souls").select("impact_points").eq("soul_id", soulId).maybeSingle()

      if (data?.impact_points) setImpactPoints(data.impact_points)
    }

    const fetchCollisions = async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from("collisions")
        .select("*", { count: "exact", head: true })
        .eq("sphere", "zenith")
        .gte("created_at", twentyFourHoursAgo)

      if (count) setRecentCollisions(count)
    }

    registerPresence()
    fetchCollisions()

    const interval = setInterval(() => {
      registerPresence()
      fetchCollisions()
    }, 30000)

    return () => {
      clearInterval(interval)
      supabase.from("presence").delete().eq("soul_id", soulId)
    }
  }, [supabase])

  const handleCollision = (roomId: string, matchedSoul: { name: string; matchScore: number }) => {
    setActiveChat({ roomId, matchedSoul })
  }

  const handleSyncDropActive = () => {
    setSyncDropActive(true)
    setTimeout(() => setSyncDropActive(false), 5 * 60 * 1000)
  }

  return (
    <div className="relative min-h-screen bg-[#020202] overflow-hidden">
      <ResonanceGrid sphere="zenith" onUserCount={setUserCount} />

      <SyncDropNotification onSyncDropActive={handleSyncDropActive} />

      <AnimatePresence>{syncDropActive && <Global3DMap isActive={syncDropActive} />}</AnimatePresence>

      {/* Sunburst background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-2 bg-gradient-to-b from-amber-500/20 to-transparent"
              style={{
                height: "400px",
                transformOrigin: "center top",
                transform: `rotate(${i * 30}deg) translateX(-50%)`,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="absolute top-4 left-4 z-30">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Return</span>
          </motion.button>
        </Link>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setShowShop(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-4 right-4 z-30 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-500/50 transition-all"
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="text-sm">Shop</span>
        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-amber-500/20 rounded-full">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span className="text-xs font-mono text-amber-300">{impactPoints}</span>
        </div>
      </motion.button>

      <ImpactPointsDisplay />

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Sun className="w-10 h-10 text-amber-400" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              The Zenith
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            High-energy collisions for finding love and friendship
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4 mt-4"
          >
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>Vibe-matched connections</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <MoodSelector currentMood={currentMood} onMoodChange={setCurrentMood} />
        </motion.div>

        {/* Main Sync Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          {/* Orbiting hearts */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${i * 90}deg) translateY(-80px)`,
                }}
              >
                <Heart className="w-4 h-4 text-amber-400/50" />
              </motion.div>
            ))}
          </motion.div>

          <SyncButton sphere="zenith" onCollision={handleCollision} />
          <p className="text-center text-zinc-500 text-sm mt-4">Hold to find your match</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-6 mt-12"
        >
          <div className="text-center">
            <div className="bg-zinc-950/80 backdrop-blur-xl rounded-xl border border-zinc-800 p-4">
              <Star className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-400">{userCount}</p>
              <p className="text-xs text-zinc-500">Online Now</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-zinc-950/80 backdrop-blur-xl rounded-xl border border-zinc-800 p-4">
              <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-400">{recentCollisions}</p>
              <p className="text-xs text-zinc-500">Collisions Today</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-zinc-950/80 backdrop-blur-xl rounded-xl border border-zinc-800 p-4">
              <Heart className="w-5 h-5 text-rose-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-rose-400">100%</p>
              <p className="text-xs text-zinc-500">Human Only</p>
            </div>
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-8 text-center text-zinc-600 text-sm max-w-md"
        >
          Where real humans collide. No algorithms. No bots. Just authentic connections.
        </motion.p>
      </div>

      <AnimatePresence>
        {activeChat && (
          <TransparencyChat
            roomId={activeChat.roomId}
            sphere="zenith"
            matchedSoul={activeChat.matchedSoul}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>

      <EssenceShop isOpen={showShop} onClose={() => setShowShop(false)} />
    </div>
  )
}
