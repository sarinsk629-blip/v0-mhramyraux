"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Flame, Zap, TrendingUp } from "lucide-react"
import { updateStreak } from "@/app/actions/gamification"

interface StreakData {
  current_streak: number
  longest_streak: number
  multiplier: number
}

export function StreakDisplay({ soulId }: { soulId: string }) {
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [showBonus, setShowBonus] = useState(false)
  const [bonusPoints, setBonusPoints] = useState(0)

  useEffect(() => {
    async function checkStreak() {
      const result = await updateStreak(soulId)
      setStreak(result.streak)

      if (result.pointsEarned > 0) {
        setBonusPoints(result.pointsEarned)
        setShowBonus(true)
        setTimeout(() => setShowBonus(false), 3000)
      }
    }
    checkStreak()
  }, [soulId])

  if (!streak) return null

  const flameIntensity = Math.min(streak.current_streak / 30, 1)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-24 left-6 z-40">
      <div className="relative p-4 rounded-2xl bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/30 backdrop-blur-sm">
        {/* Animated Flame */}
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2"
          animate={{
            scale: [1, 1.1 + flameIntensity * 0.2, 1],
            rotate: [-2, 2, -2],
          }}
          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
        >
          <Flame
            className="w-8 h-8"
            style={{
              color: `hsl(${30 - flameIntensity * 20}, 100%, ${50 + flameIntensity * 20}%)`,
              filter: `drop-shadow(0 0 ${8 + flameIntensity * 8}px hsl(${30 - flameIntensity * 20}, 100%, 50%))`,
            }}
          />
        </motion.div>

        <div className="text-center pt-2">
          <div className="text-3xl font-bold text-orange-400">{streak.current_streak}</div>
          <div className="text-xs text-zinc-400 uppercase tracking-wider">Day Streak</div>

          {streak.multiplier > 1 && (
            <div className="flex items-center justify-center gap-1 mt-2 text-amber-400 text-sm">
              <Zap className="w-3 h-3" />
              <span>{streak.multiplier.toFixed(1)}x Bonus</span>
            </div>
          )}

          {streak.longest_streak > streak.current_streak && (
            <div className="flex items-center justify-center gap-1 mt-1 text-zinc-500 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>Best: {streak.longest_streak}</span>
            </div>
          )}
        </div>

        {/* Bonus Points Animation */}
        {showBonus && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: -30 }}
            transition={{ duration: 2 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-amber-400 font-bold whitespace-nowrap"
          >
            +{bonusPoints} streak bonus!
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
