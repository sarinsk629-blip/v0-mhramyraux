"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  getEssenceBalance,
  purchaseAura,
  purchaseFrequencyBoost,
  getAvailableAuras,
  type EssenceBalance,
} from "@/app/actions/essence-economy"
import { generateSoulId } from "@/lib/soul-identity"
import { X, Sparkles, Zap, Crown, Flame, Moon, Sun, Check } from "lucide-react"

interface EssenceShopProps {
  isOpen: boolean
  onClose: () => void
}

interface PremiumAura {
  id: string
  name: string
  cost: number
  glow_color: string
  particle_effect: string
  description: string
  rarity: string
}

const rarityColors = {
  common: "text-zinc-400 border-zinc-600",
  rare: "text-blue-400 border-blue-500",
  epic: "text-purple-400 border-purple-500",
  legendary: "text-amber-400 border-amber-500",
}

const auraIcons: Record<string, typeof Sparkles> = {
  "Ethereal Mist": Moon,
  "Cosmic Pulse": Sparkles,
  "Phoenix Flame": Flame,
  "Void Master": Crown,
  "Zenith Legend": Sun,
}

export function EssenceShop({ isOpen, onClose }: EssenceShopProps) {
  const [balance, setBalance] = useState<EssenceBalance | null>(null)
  const [auras, setAuras] = useState<PremiumAura[]>([])
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [boostDuration, setBoostDuration] = useState(30)
  const soulId = generateSoulId()

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    const [balanceData, aurasData] = await Promise.all([getEssenceBalance(soulId), getAvailableAuras()])
    setBalance(balanceData)
    setAuras(aurasData)
  }

  const handlePurchaseAura = async (auraName: string) => {
    setPurchasing(auraName)
    setMessage(null)

    const result = await purchaseAura(soulId, auraName)

    if (result.success) {
      setMessage({ type: "success", text: result.message })
      setBalance((prev) => (prev ? { ...prev, points: result.newBalance!, aura: auraName } : null))
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate([50, 30, 50])
    } else {
      setMessage({ type: "error", text: result.message })
    }

    setPurchasing(null)
    setTimeout(() => setMessage(null), 3000)
  }

  const handlePurchaseBoost = async () => {
    setPurchasing("boost")
    setMessage(null)

    const result = await purchaseFrequencyBoost(soulId, boostDuration)

    if (result.success) {
      setMessage({ type: "success", text: result.message })
      await fetchData()
      if (navigator.vibrate) navigator.vibrate([50, 30, 50])
    } else {
      setMessage({ type: "error", text: result.message })
    }

    setPurchasing(null)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Essence Shop</h2>
                <p className="text-sm text-zinc-400">Unlock premium auras and boosts</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-full">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-mono font-bold text-amber-300">{balance?.points || 0}</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>

            {/* Message toast */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mx-4 mt-4 p-3 rounded-lg ${
                    message.type === "success"
                      ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-200"
                      : "bg-red-500/20 border border-red-500/50 text-red-200"
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 space-y-6">
              {/* Frequency Boost Section */}
              <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">Frequency Boost</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Boost your frequency to be seen by 2x more souls during matchmaking
                </p>

                <div className="flex items-center gap-4">
                  <select
                    value={boostDuration}
                    onChange={(e) => setBoostDuration(Number(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value={15}>15 minutes (150 pts)</option>
                    <option value={30}>30 minutes (300 pts)</option>
                    <option value={60}>60 minutes (600 pts)</option>
                  </select>

                  <motion.button
                    onClick={handlePurchaseBoost}
                    disabled={purchasing === "boost"}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-700 rounded-lg font-medium text-white flex items-center gap-2"
                  >
                    {purchasing === "boost" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Activate Boost
                      </>
                    )}
                  </motion.button>
                </div>

                {balance?.hasBoost && (
                  <div className="mt-3 text-sm text-cyan-400">
                    Active boost expires: {new Date(balance.boostExpiresAt!).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Premium Auras */}
              <div>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Premium Auras
                </h3>

                <div className="grid gap-3">
                  {auras.map((aura) => {
                    const Icon = auraIcons[aura.name] || Sparkles
                    const isOwned = balance?.aura === aura.name.toLowerCase().replace(/\s+/g, "_")
                    const rarityClass = rarityColors[aura.rarity as keyof typeof rarityColors]

                    return (
                      <motion.div
                        key={aura.id}
                        className={`relative p-4 rounded-xl border ${
                          isOwned ? "bg-zinc-800/50 border-emerald-500/50" : "bg-zinc-900/50 border-zinc-800"
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        {/* Glow effect preview */}
                        <div
                          className="absolute top-2 right-2 w-8 h-8 rounded-full blur-lg"
                          style={{ backgroundColor: aura.glow_color, opacity: 0.5 }}
                        />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${aura.glow_color}20` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: aura.glow_color }} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{aura.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${rarityClass}`}>
                                  {aura.rarity}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-400">{aura.description}</p>
                            </div>
                          </div>

                          {isOwned ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Check className="w-5 h-5" />
                              <span className="text-sm font-medium">Owned</span>
                            </div>
                          ) : (
                            <motion.button
                              onClick={() => handlePurchaseAura(aura.name)}
                              disabled={purchasing === aura.name || (balance?.points || 0) < aura.cost}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium text-white flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              {aura.cost} pts
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
