"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { generateSoulId, getSoulName, generateVibeFrequency, calculateVibeMatch } from "@/lib/soul-identity"

interface SyncButtonProps {
  sphere: "void" | "pulse" | "zenith"
  onCollision: (roomId: string, matchedSoul: { name: string; matchScore: number }) => void
}

export function SyncButton({ sphere, onCollision }: SyncButtonProps) {
  const [isSeeking, setIsSeeking] = useState(false)
  const [progress, setProgress] = useState(0)
  const [matchFound, setMatchFound] = useState(false)
  const seekingRef = useRef(false)
  const supabase = createClient()

  const handleSync = useCallback(async () => {
    if (seekingRef.current) return
    seekingRef.current = true
    setIsSeeking(true)
    setProgress(0)

    const soulId = generateSoulId()
    const soulName = getSoulName()
    const vibeFrequency = generateVibeFrequency()

    // Update presence to seeking status
    await supabase.from("presence").upsert(
      {
        soul_id: soulId,
        soul_name: soulName,
        sphere,
        vibe_frequency: vibeFrequency,
        status: "seeking",
        last_ping: new Date().toISOString(),
      },
      { onConflict: "soul_id" },
    )

    // Haptic feedback on start
    if (navigator.vibrate) navigator.vibrate(50)

    // Simulate seeking progress while checking for matches
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 95))
    }, 100)

    // Look for another seeking soul
    const checkForMatch = async () => {
      const { data: seekers } = await supabase
        .from("presence")
        .select("*")
        .eq("sphere", sphere)
        .eq("status", "seeking")
        .neq("soul_id", soulId)
        .limit(10)

      if (seekers && seekers.length > 0) {
        // Find best vibe match
        let bestMatch = seekers[0]
        let bestScore = calculateVibeMatch(vibeFrequency, seekers[0].vibe_frequency)

        seekers.forEach((seeker) => {
          const score = calculateVibeMatch(vibeFrequency, seeker.vibe_frequency)
          if (score > bestScore) {
            bestMatch = seeker
            bestScore = score
          }
        })

        clearInterval(progressInterval)
        setProgress(100)
        setMatchFound(true)

        // Create collision room
        const roomId = `${sphere}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

        await supabase.from("collisions").insert({
          soul_a: soulId,
          soul_b: bestMatch.soul_id,
          room_id: roomId,
          sphere,
          status: "active",
        })

        // Update both souls to connected
        await supabase.from("presence").update({ status: "connected" }).in("soul_id", [soulId, bestMatch.soul_id])

        // Haptic feedback on match
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])

        setTimeout(() => {
          onCollision(roomId, { name: bestMatch.soul_name, matchScore: bestScore })
          setIsSeeking(false)
          setMatchFound(false)
          seekingRef.current = false
        }, 1500)

        return true
      }
      return false
    }

    // Check for match every 2 seconds for 30 seconds
    let attempts = 0
    const maxAttempts = 15

    const matchInterval = setInterval(async () => {
      attempts++
      const found = await checkForMatch()

      if (found || attempts >= maxAttempts) {
        clearInterval(matchInterval)
        clearInterval(progressInterval)

        if (!found) {
          // No match found, reset
          await supabase.from("presence").update({ status: "active" }).eq("soul_id", soulId)

          setProgress(0)
          setIsSeeking(false)
          seekingRef.current = false
        }
      }
    }, 2000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(matchInterval)
    }
  }, [sphere, onCollision, supabase])

  const handleRelease = useCallback(async () => {
    if (!seekingRef.current) return

    const soulId = generateSoulId()
    await supabase.from("presence").update({ status: "active" }).eq("soul_id", soulId)

    setIsSeeking(false)
    setProgress(0)
    seekingRef.current = false
  }, [supabase])

  return (
    <div className="relative">
      <motion.button
        className="relative w-32 h-32 rounded-full overflow-hidden"
        onMouseDown={handleSync}
        onMouseUp={handleRelease}
        onTouchStart={handleSync}
        onTouchEnd={handleRelease}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              sphere === "void"
                ? "radial-gradient(circle, #8b5cf6 0%, #4c1d95 50%, #020202 100%)"
                : sphere === "pulse"
                  ? "radial-gradient(circle, #f43f5e 0%, #9f1239 50%, #020202 100%)"
                  : "radial-gradient(circle, #fbbf24 0%, #b45309 50%, #020202 100%)",
          }}
          animate={
            isSeeking
              ? {
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }
              : {}
          }
          transition={{ duration: 1, repeat: isSeeking ? Number.POSITIVE_INFINITY : 0 }}
        />

        {/* Progress ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeDasharray={364}
            strokeDashoffset={364 - (364 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {matchFound ? (
              <motion.span
                key="found"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="text-white font-bold text-lg"
              >
                COLLIDE!
              </motion.span>
            ) : isSeeking ? (
              <motion.span
                key="seeking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white/80 text-sm font-medium"
              >
                Seeking...
              </motion.span>
            ) : (
              <motion.span
                key="sync"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white font-bold"
              >
                SYNC
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Impact animation on match */}
      <AnimatePresence>
        {matchFound && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border-2 border-white"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: i * 0.2 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
