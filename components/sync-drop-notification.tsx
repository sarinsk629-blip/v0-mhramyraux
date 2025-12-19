"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { getSyncDropStatus, type SyncDropStatus } from "@/app/actions/sync-drop"
import { Globe, Zap, Clock, Users } from "lucide-react"

interface SyncDropNotificationProps {
  onSyncDropActive?: () => void
}

export function SyncDropNotification({ onSyncDropActive }: SyncDropNotificationProps) {
  const [status, setStatus] = useState<SyncDropStatus | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const supabase = createClient()

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      const s = await getSyncDropStatus()
      setStatus(s)
      if (s.isActive) {
        setShowNotification(true)
        setCountdown(s.minutesRemaining || 0)
        onSyncDropActive?.()
        // Trigger haptic
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 200])
        }
      }
    }
    fetchStatus()
  }, [onSyncDropActive])

  // Subscribe to sync_drops table for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("sync_drops_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "sync_drops" }, async () => {
        const s = await getSyncDropStatus()
        setStatus(s)
        if (s.isActive && !showNotification) {
          setShowNotification(true)
          setCountdown(s.minutesRemaining || 0)
          onSyncDropActive?.()
          // Global vibration alert
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200])
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, showNotification, onSyncDropActive])

  // Countdown timer
  useEffect(() => {
    if (!status?.isActive || countdown === null) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          setShowNotification(false)
          return null
        }
        return prev - 1 / 60 // Decrease by 1 second
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status?.isActive, countdown])

  const formatTime = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.floor((minutes - mins) * 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <AnimatePresence>
      {showNotification && status?.isActive && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
          <motion.div
            className="relative px-6 py-4 rounded-2xl border overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.1))",
              borderColor: "rgba(251, 191, 36, 0.5)",
              boxShadow: "0 0 40px rgba(251, 191, 36, 0.3)",
            }}
            animate={{
              boxShadow: [
                "0 0 40px rgba(251, 191, 36, 0.3)",
                "0 0 60px rgba(251, 191, 36, 0.5)",
                "0 0 40px rgba(251, 191, 36, 0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.5), transparent)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />

            <div className="relative flex items-center gap-4">
              {/* Pulsing globe icon */}
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              >
                <Globe className="w-8 h-8 text-amber-400" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-amber-400/30"
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                />
              </motion.div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span className="text-amber-100 font-bold text-lg">GLOBAL SYNC DROP</span>
                </div>
                <span className="text-amber-200/80 text-sm">All souls visible on the 3D map!</span>
              </div>

              {/* Timer */}
              <div className="flex flex-col items-center ml-4 pl-4 border-l border-amber-400/30">
                <div className="flex items-center gap-1 text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-xl font-bold">
                    {countdown !== null ? formatTime(countdown) : "--:--"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-200/60 text-xs">
                  <Users className="w-3 h-3" />
                  <span>{status.totalSoulsVisible} souls</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
