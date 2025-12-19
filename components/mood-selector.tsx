"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { generateSoulId, setSoulMood, type SoulMood } from "@/lib/soul-identity"
import { Sun, Moon, Search, Heart, Zap, Circle } from "lucide-react"

const moods: { value: SoulMood; icon: typeof Sun; label: string; color: string; description: string }[] = [
  { value: "radiant", icon: Sun, label: "Radiant", color: "#fbbf24", description: "Feeling bright & positive" },
  { value: "calm", icon: Moon, label: "Calm", color: "#60a5fa", description: "Peaceful & reflective" },
  { value: "seeking", icon: Search, label: "Seeking", color: "#a78bfa", description: "Looking for connection" },
  { value: "healing", icon: Heart, label: "Healing", color: "#f472b6", description: "Need gentle support" },
  { value: "electric", icon: Zap, label: "Electric", color: "#34d399", description: "High energy & excited" },
  { value: "neutral", icon: Circle, label: "Neutral", color: "#9ca3af", description: "Just exploring" },
]

interface MoodSelectorProps {
  currentMood: SoulMood
  onMoodChange?: (mood: SoulMood) => void
}

export function MoodSelector({ currentMood, onMoodChange }: MoodSelectorProps) {
  const [selected, setSelected] = useState<SoulMood>(currentMood)
  const supabase = createClient()
  const soulId = generateSoulId()

  const handleSelect = async (mood: SoulMood) => {
    setSelected(mood)
    setSoulMood(mood)

    // Update in database
    await supabase.from("souls").update({ current_mood: mood }).eq("soul_id", soulId)

    onMoodChange?.(mood)

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(20)
  }

  return (
    <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-3">Current Mood</h3>

      <div className="grid grid-cols-3 gap-2">
        {moods.map((mood) => {
          const Icon = mood.icon
          const isSelected = selected === mood.value

          return (
            <motion.button
              key={mood.value}
              onClick={() => handleSelect(mood.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-3 rounded-xl border transition-all ${
                isSelected ? "border-white/30 bg-zinc-800" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="mood-glow"
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: `${mood.color}15` }}
                />
              )}

              <div className="relative flex flex-col items-center gap-1">
                <Icon className="w-5 h-5" style={{ color: mood.color }} />
                <span className="text-xs text-zinc-300">{mood.label}</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-zinc-500 text-center">{moods.find((m) => m.value === selected)?.description}</p>
    </div>
  )
}
