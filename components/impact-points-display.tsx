"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { generateSoulId } from "@/lib/soul-identity"
import { Sparkles, Heart, MessageCircle, Zap } from "lucide-react"

interface ImpactData {
  points: number
  total_connections: number
  total_messages: number
  kindness_streak: number
}

const DEFAULT_IMPACT_DATA: ImpactData = {
  points: 0,
  total_connections: 0,
  total_messages: 0,
  kindness_streak: 0,
}

export function ImpactPointsDisplay() {
  const [data, setData] = useState<ImpactData>(DEFAULT_IMPACT_DATA)
  const [showAnimation, setShowAnimation] = useState(false)
  const [prevPoints, setPrevPoints] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const soulId = generateSoulId()

    const fetchData = async () => {
      const { data: impactData } = await supabase.from("impact_points").select("*").eq("soul_id", soulId).maybeSingle()

      if (impactData) {
        if (data && impactData.points > data.points) {
          setShowAnimation(true)
          setTimeout(() => setShowAnimation(false), 1000)
        }
        setPrevPoints(data?.points || 0)
        setData(impactData as ImpactData)
      }
      // If no data exists, we keep the default values
    }

    fetchData()

    // Subscribe to changes
    const channel = supabase
      .channel("impact_points_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "impact_points", filter: `soul_id=eq.${soulId}` },
        () => {
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 right-4 z-40">
      <div className="bg-zinc-950/80 backdrop-blur-xl rounded-2xl border border-zinc-800 p-4 min-w-[200px]">
        {/* Main points */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-amber-400" />
            <AnimatePresence>
              {showAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Impact Points</p>
            <motion.p
              key={data.points}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-amber-400"
            >
              {data.points.toLocaleString()}
            </motion.p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Connections</p>
            <p className="text-sm font-medium text-white">{data.total_connections}</p>
          </div>
          <div className="text-center">
            <MessageCircle className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Messages</p>
            <p className="text-sm font-medium text-white">{data.total_messages}</p>
          </div>
          <div className="text-center">
            <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-xs text-zinc-500">Streak</p>
            <p className="text-sm font-medium text-white">{data.kindness_streak}</p>
          </div>
        </div>

        {/* Points animation */}
        <AnimatePresence>
          {showAnimation && data.points > prevPoints && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -30 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 right-2 text-amber-400 font-bold"
            >
              +{data.points - prevPoints}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
