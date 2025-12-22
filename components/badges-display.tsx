"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Link,
  Compass,
  Heart,
  Crown,
  Flame,
  Moon,
  Sun,
  Globe,
  Star,
  Award,
  Trophy,
  Zap,
  X,
} from "lucide-react"
import { getSoulBadges } from "@/app/actions/gamification"

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
  requirement_type: string
  requirement_value: number
  points_reward: number
  earned_at?: string
  progress?: number
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-6 h-6" />,
  link: <Link className="w-6 h-6" />,
  bridge: <Zap className="w-6 h-6" />,
  compass: <Compass className="w-6 h-6" />,
  heart: <Heart className="w-6 h-6" />,
  "heart-handshake": <Heart className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
  flame: <Flame className="w-6 h-6" />,
  fire: <Flame className="w-6 h-6" />,
  infinity: <Award className="w-6 h-6" />,
  moon: <Moon className="w-6 h-6" />,
  activity: <Zap className="w-6 h-6" />,
  sun: <Sun className="w-6 h-6" />,
  globe: <Globe className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
}

const rarityColors: Record<string, { bg: string; border: string; glow: string }> = {
  common: { bg: "bg-zinc-800", border: "border-zinc-600", glow: "shadow-zinc-500/20" },
  rare: { bg: "bg-blue-900/50", border: "border-blue-500", glow: "shadow-blue-500/30" },
  epic: { bg: "bg-purple-900/50", border: "border-purple-500", glow: "shadow-purple-500/40" },
  legendary: { bg: "bg-amber-900/50", border: "border-amber-500", glow: "shadow-amber-500/50" },
  mythic: { bg: "bg-rose-900/50", border: "border-rose-400", glow: "shadow-rose-400/60" },
}

export function BadgesDisplay({ soulId }: { soulId: string }) {
  const [earned, setEarned] = useState<Badge[]>([])
  const [available, setAvailable] = useState<Badge[]>([])
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    async function loadBadges() {
      const data = await getSoulBadges(soulId)
      setEarned(data.earned)
      setAvailable(data.available)
    }
    loadBadges()
  }, [soulId])

  return (
    <>
      {/* Badge Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 backdrop-blur-sm"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Trophy className="w-6 h-6 text-amber-400" />
        {earned.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-xs flex items-center justify-center text-black font-bold">
            {earned.length}
          </span>
        )}
      </motion.button>

      {/* Badges Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900/90 border border-zinc-700 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Soul Badges</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Earned Badges */}
              {earned.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">Earned ({earned.length})</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {earned.map((badge) => (
                      <motion.button
                        key={badge.id}
                        onClick={() => setSelectedBadge(badge)}
                        className={`relative p-4 rounded-xl border ${rarityColors[badge.rarity].bg} ${rarityColors[badge.rarity].border} shadow-lg ${rarityColors[badge.rarity].glow}`}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-white flex justify-center">
                          {iconMap[badge.icon] || <Star className="w-6 h-6" />}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Badges */}
              <div>
                <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-4">Available ({available.length})</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {available.map((badge) => (
                    <motion.button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className="relative p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 opacity-60"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-zinc-500 flex justify-center">
                        {iconMap[badge.icon] || <Star className="w-6 h-6" />}
                      </div>
                      {/* Progress Ring */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-zinc-700"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${(badge.progress || 0) * 2.83} 283`}
                          className="text-amber-500/50"
                        />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Badge Detail Modal */}
            <AnimatePresence>
              {selectedBadge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 flex items-center justify-center p-4"
                  onClick={() => setSelectedBadge(null)}
                >
                  <div
                    className={`p-6 rounded-2xl border ${rarityColors[selectedBadge.rarity].bg} ${rarityColors[selectedBadge.rarity].border} shadow-2xl ${rarityColors[selectedBadge.rarity].glow} max-w-xs text-center`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-black/30 flex items-center justify-center text-white">
                      {iconMap[selectedBadge.icon] || <Star className="w-8 h-8" />}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-1">{selectedBadge.name}</h4>
                    <p className="text-sm text-zinc-400 mb-3">{selectedBadge.description}</p>
                    <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
                      <Star className="w-4 h-4" />
                      <span>+{selectedBadge.points_reward} Points</span>
                    </div>
                    {selectedBadge.earned_at && (
                      <p className="text-xs text-zinc-500 mt-2">
                        Earned {new Date(selectedBadge.earned_at).toLocaleDateString()}
                      </p>
                    )}
                    {selectedBadge.progress !== undefined && (
                      <div className="mt-3">
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${selectedBadge.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{Math.round(selectedBadge.progress)}% Complete</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
