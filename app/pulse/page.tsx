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
import { ArrowLeft, Heart, Zap, Users, Trophy, ShoppingBag, Sparkles } from "lucide-react"
import Link from "next/link"

export default function PulsePage() {
  const [activeChat, setActiveChat] = useState<{
    roomId: string
    matchedSoul: { name: string; matchScore: number }
  } | null>(null)
  const [userCount, setUserCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState<Array<{ soul_id: string; points: number }>>([])
  const [syncDropActive, setSyncDropActive] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [currentMood, setCurrentMood] = useState<SoulMood>("electric")
  const [impactPoints, setImpactPoints] = useState(0)
  const supabase = createClient()

  // Register presence and fetch leaderboard
  useEffect(() => {
    const soulId = generateSoulId()
    const soulName = getSoulName()
    setCurrentMood(getSoulMood())

    const registerPresence = async () => {
      await supabase.from("presence").upsert(
        {
          soul_id: soulId,
          soul_name: soulName,
          sphere: "pulse",
          vibe_frequency: generateVibeFrequency(),
          status: "active",
          last_ping: new Date().toISOString(),
        },
        { onConflict: "soul_id" },
      )

      const { data } = await supabase.from("souls").select("impact_points").eq("soul_id", soulId).single()
      if (data?.impact_points) setImpactPoints(data.impact_points)
    }

    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("impact_points")
        .select("soul_id, points")
        .order("points", { ascending: false })
        .limit(5)

      if (data) setLeaderboard(data)
    }

    registerPresence()
    fetchLeaderboard()

    const interval = setInterval(() => {
      registerPresence()
      fetchLeaderboard()
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
      <ResonanceGrid sphere="pulse" onUserCount={setUserCount} />

      <SyncDropNotification onSyncDropActive={handleSyncDropActive} />
      <AnimatePresence>{syncDropActive && <Global3DMap isActive={syncDropActive} />}</AnimatePresence>

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
        className="fixed top-4 right-4 z-30 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-zinc-800 text-zinc-300 hover:text-white hover:border-rose-500/50 transition-all"
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="text-sm">Shop</span>
        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-rose-500/20 rounded-full">
          <Sparkles className="w-3 h-3 text-rose-400" />
          <span className="text-xs font-mono text-rose-300">{impactPoints}</span>
        </div>
      </motion.button>

      <ImpactPointsDisplay />

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
            >
              <Heart className="w-8 h-8 text-rose-500" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600 bg-clip-text text-transparent">
              The Pulse
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">A high-speed life-hub for daily human interactions</p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-4 text-sm text-rose-300"
          >
            <Zap className="w-4 h-4" />
            <span>Earn Impact Points through kindness</span>
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

        {/* Main Content Grid */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Sync Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <SyncButton sphere="pulse" onCollision={handleCollision} />
            <p className="text-center text-zinc-500 text-sm mt-4">Hold to connect</p>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-950/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-4 min-w-[220px]"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-white">Top Souls</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div
                  key={entry.soul_id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900/50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        i === 0
                          ? "text-amber-400"
                          : i === 1
                            ? "text-zinc-400"
                            : i === 2
                              ? "text-amber-700"
                              : "text-zinc-500"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <span className="text-xs text-zinc-400 truncate max-w-[80px]">
                      {entry.soul_id.substring(0, 12)}...
                    </span>
                  </div>
                  <span className="text-sm font-medium text-rose-400">{entry.points}</span>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">No data yet</p>}
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-8 text-center mt-12"
        >
          <div>
            <p className="text-2xl font-bold text-rose-400">{userCount}</p>
            <p className="text-xs text-zinc-500">Active Souls</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            <p className="text-xs text-zinc-400">Daily connections hub</p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeChat && (
          <TransparencyChat
            roomId={activeChat.roomId}
            sphere="pulse"
            matchedSoul={activeChat.matchedSoul}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>

      <EssenceShop isOpen={showShop} onClose={() => setShowShop(false)} />
    </div>
  )
}
