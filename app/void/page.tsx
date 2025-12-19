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
import { ArrowLeft, Shield, Moon, Heart, ShoppingBag, Sparkles } from "lucide-react"
import Link from "next/link"

export default function VoidPage() {
  const [activeChat, setActiveChat] = useState<{
    roomId: string
    matchedSoul: { name: string; matchScore: number }
  } | null>(null)
  const [userCount, setUserCount] = useState(0)
  const [syncDropActive, setSyncDropActive] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [currentMood, setCurrentMood] = useState<SoulMood>("healing")
  const [impactPoints, setImpactPoints] = useState(0)
  const supabase = createClient()

  // Register presence
  useEffect(() => {
    const soulId = generateSoulId()
    const soulName = getSoulName()
    setCurrentMood(getSoulMood())

    const registerPresence = async () => {
      await supabase.from("presence").upsert(
        {
          soul_id: soulId,
          soul_name: soulName,
          sphere: "void",
          vibe_frequency: generateVibeFrequency(),
          status: "active",
          last_ping: new Date().toISOString(),
        },
        { onConflict: "soul_id" },
      )

      const { data } = await supabase.from("souls").select("impact_points").eq("soul_id", soulId).single()
      if (data?.impact_points) setImpactPoints(data.impact_points)
    }

    registerPresence()
    const interval = setInterval(registerPresence, 30000)

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
      <ResonanceGrid sphere="void" onUserCount={setUserCount} />

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
        className="fixed top-4 right-4 z-30 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-zinc-800 text-zinc-300 hover:text-white hover:border-violet-500/50 transition-all"
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="text-sm">Shop</span>
        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-violet-500/20 rounded-full">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-xs font-mono text-violet-300">{impactPoints}</span>
        </div>
      </motion.button>

      <ImpactPointsDisplay />

      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Moon className="w-8 h-8 text-violet-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600 bg-clip-text text-transparent">
              The Void
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">
            An anonymous healing space for real humans seeking solace
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-4 text-sm text-violet-300"
          >
            <Shield className="w-4 h-4" />
            <span>Protected by AI Guardian</span>
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

        {/* Sync Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <SyncButton sphere="void" onCollision={handleCollision} />
          <p className="text-center text-zinc-500 text-sm mt-4">Hold to find a kindred soul</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-8 text-center"
        >
          <div>
            <p className="text-2xl font-bold text-violet-400">{userCount}</p>
            <p className="text-xs text-zinc-500">Souls in the Void</p>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            <p className="text-xs text-zinc-400">Safe space for healing</p>
          </div>
        </motion.div>

        {/* Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-md text-center"
        >
          <p className="text-zinc-600 text-xs">
            This is a safe space. Aggression and harassment are shadow-banned. Be kind. Be human. You are not alone.
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeChat && (
          <TransparencyChat
            roomId={activeChat.roomId}
            sphere="void"
            matchedSoul={activeChat.matchedSoul}
            onClose={() => setActiveChat(null)}
          />
        )}
      </AnimatePresence>

      <EssenceShop isOpen={showShop} onClose={() => setShowShop(false)} />
    </div>
  )
}
