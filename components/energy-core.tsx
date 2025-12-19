"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { generateSoulId, generateSoulName } from "@/lib/soul-identity"

interface EnergyCoreProps {
  onEnter: (soulId: string, soulName: string) => void
}

export function EnergyCore({ onEnter }: EnergyCoreProps) {
  const [isActivating, setIsActivating] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleActivate = async () => {
    if (isActivating) return
    setIsActivating(true)

    try {
      const supabase = createClient()
      const soulId = generateSoulId()
      const soulName = generateSoulName()

      // Get user's country from IP (using a free API)
      let countryCode = "XX"
      let countryName = "Unknown"

      try {
        const geoResponse = await fetch("https://ipapi.co/json/")
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          countryCode = geoData.country_code || "XX"
          countryName = geoData.country_name || "Unknown"
        }
      } catch {
        // Fallback to unknown if geo lookup fails
      }

      // Register or update soul in database
      const { error } = await supabase.from("souls").upsert(
        {
          soul_id: soulId,
          country_code: countryCode,
          country_name: countryName,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "soul_id" },
      )

      if (error) {
        console.error("Error registering soul:", error)
      }

      try {
        const { error: rpcError } = await supabase.rpc("increment_connections")
        if (rpcError) {
          // If RPC doesn't exist, update directly by incrementing
          const { data: currentStats } = await supabase
            .from("global_stats")
            .select("total_connections")
            .eq("id", 1)
            .single()

          if (currentStats) {
            await supabase
              .from("global_stats")
              .update({
                total_connections: (currentStats.total_connections || 0) + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", 1)
          }
        }
      } catch {
        // Silently fail if stats update fails - non-critical
      }

      // Small delay for dramatic effect
      await new Promise((resolve) => setTimeout(resolve, 1500))

      onEnter(soulId, soulName)
    } catch (error) {
      console.error("Error activating energy core:", error)
      setIsActivating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 5, type: "spring" }}
      className="relative z-10"
    >
      <motion.button
        onClick={handleActivate}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        disabled={isActivating}
        className="relative group cursor-pointer disabled:cursor-wait"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer energy rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-emerald-500/30"
            style={{
              margin: `${-20 - i * 15}px`,
            }}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{
              rotate: { duration: 10 + i * 5, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
              scale: { duration: 1, repeat: isHovered ? Number.POSITIVE_INFINITY : 0 },
            }}
          />
        ))}

        {/* Main core button */}
        <div className="relative w-40 h-40 md:w-48 md:h-48">
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl"
            animate={{
              scale: isActivating ? [1, 2, 3] : isHovered ? [1, 1.3, 1] : 1,
              opacity: isActivating ? [0.5, 0.8, 0] : isHovered ? [0.3, 0.5, 0.3] : 0.3,
            }}
            transition={{
              duration: isActivating ? 1.5 : 2,
              repeat: isActivating ? 0 : Number.POSITIVE_INFINITY,
            }}
          />

          {/* Core sphere */}
          <motion.div
            className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-[3px]"
            animate={{
              boxShadow: isActivating
                ? [
                    "0 0 30px rgba(16, 185, 129, 0.5)",
                    "0 0 80px rgba(16, 185, 129, 0.9)",
                    "0 0 150px rgba(16, 185, 129, 1)",
                  ]
                : [
                    "0 0 20px rgba(16, 185, 129, 0.3)",
                    "0 0 40px rgba(16, 185, 129, 0.5)",
                    "0 0 20px rgba(16, 185, 129, 0.3)",
                  ],
            }}
            transition={{ duration: isActivating ? 1.5 : 2, repeat: isActivating ? 0 : Number.POSITIVE_INFINITY }}
          >
            <div className="w-full h-full rounded-full bg-zinc-950/90 backdrop-blur-xl flex items-center justify-center overflow-hidden">
              {/* Inner glow */}
              <motion.div
                className="absolute inset-8 rounded-full bg-gradient-radial from-emerald-500/20 to-transparent"
                animate={{
                  scale: isActivating ? [1, 3] : [0.9, 1.1, 0.9],
                  opacity: isActivating ? [0.5, 0] : [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: isActivating ? 1 : 3,
                  repeat: isActivating ? 0 : Number.POSITIVE_INFINITY,
                }}
              />

              {/* Core text */}
              <div className="relative z-10 text-center">
                <motion.span
                  className="block text-lg md:text-xl font-bold text-emerald-400"
                  animate={{
                    opacity: isActivating ? [1, 0] : 1,
                  }}
                >
                  {isActivating ? "SYNCHRONIZING" : "ENERGY CORE"}
                </motion.span>
                <motion.span
                  className="block text-xs text-zinc-400 mt-1"
                  animate={{
                    opacity: isActivating ? [1, 0] : 1,
                  }}
                >
                  {isActivating ? "..." : "Click to Enter"}
                </motion.span>
              </div>

              {/* Activation particles */}
              {isActivating && (
                <motion.div className="absolute inset-0">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-emerald-400 rounded-full"
                      style={{
                        top: "50%",
                        left: "50%",
                      }}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos((i / 20) * Math.PI * 2) * 100,
                        y: Math.sin((i / 20) * Math.PI * 2) * 100,
                        opacity: 0,
                        scale: [1, 2, 0],
                      }}
                      transition={{
                        duration: 1,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.button>

      {/* Instruction text */}
      <motion.p
        className="text-center text-xs text-zinc-600 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 6 }}
      >
        No sign-in required. Your soul is your identity.
      </motion.p>
    </motion.div>
  )
}
