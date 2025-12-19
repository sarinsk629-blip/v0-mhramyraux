"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface GlobalStats {
  soulsOnline: number
  totalConnections: number
  lonelinessIndex: number
}

export function GlobalCounter() {
  const [stats, setStats] = useState<GlobalStats>({
    soulsOnline: 0,
    totalConnections: 0,
    lonelinessIndex: 75,
  })
  const [displayCount, setDisplayCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    // Fetch initial stats
    const fetchStats = async () => {
      // Get active souls (seen in last 2 minutes)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
      const { count: soulsCount } = await supabase
        .from("souls")
        .select("*", { count: "exact", head: true })
        .gte("last_seen", twoMinutesAgo)

      // Get global stats
      const { data: globalStats } = await supabase.from("global_stats").select("*").eq("id", 1).single()

      if (globalStats) {
        const newStats = {
          soulsOnline: soulsCount || 0,
          totalConnections: globalStats.total_connections || 0,
          lonelinessIndex: globalStats.loneliness_index || 75,
        }
        setStats(newStats)
      }
    }

    fetchStats()

    // Subscribe to realtime changes
    const soulsChannel = supabase
      .channel("souls_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "souls" }, () => fetchStats())
      .subscribe()

    const statsChannel = supabase
      .channel("stats_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "global_stats" }, () => fetchStats())
      .subscribe()

    // Refresh stats periodically
    const interval = setInterval(fetchStats, 10000)

    return () => {
      supabase.removeChannel(soulsChannel)
      supabase.removeChannel(statsChannel)
      clearInterval(interval)
    }
  }, [])

  // Animate counter
  useEffect(() => {
    const target = stats.soulsOnline
    const duration = 1500
    const steps = 30
    const increment = (target - displayCount) / steps
    let current = displayCount
    let step = 0

    const timer = setInterval(() => {
      step++
      current += increment
      setDisplayCount(Math.round(current))
      if (step >= steps) {
        setDisplayCount(target)
        clearInterval(timer)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [stats.soulsOnline])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 3 }}
      className="relative z-10 flex flex-col items-center gap-8"
    >
      {/* Souls Synchronized Counter */}
      <div className="text-center">
        <motion.div
          className="relative"
          animate={{
            textShadow: [
              "0 0 20px rgba(110, 231, 183, 0.5)",
              "0 0 40px rgba(110, 231, 183, 0.8)",
              "0 0 20px rgba(110, 231, 183, 0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <span className="text-6xl md:text-8xl font-bold tabular-nums text-emerald-400">
            <AnimatePresence mode="popLayout">
              {displayCount
                .toLocaleString()
                .split("")
                .map((digit, i) => (
                  <motion.span
                    key={`${digit}-${i}`}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                  >
                    {digit}
                  </motion.span>
                ))}
            </AnimatePresence>
          </span>
        </motion.div>
        <p className="text-sm md:text-base text-zinc-400 mt-2 uppercase tracking-[0.3em]">Souls Synchronized</p>
      </div>

      {/* Global Loneliness Index */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Connected</span>
          <span>Global Loneliness Index</span>
          <span>Isolated</span>
        </div>
        <div className="relative h-3 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
          {/* Pulsing background */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                "linear-gradient(90deg, #10b981 0%, #ef4444 100%)",
                "linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)",
                "linear-gradient(90deg, #10b981 0%, #ef4444 100%)",
              ],
            }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
          />
          {/* Progress bar */}
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, 
                #10b981 0%, 
                #f59e0b ${stats.lonelinessIndex / 2}%, 
                #ef4444 100%)`,
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${stats.lonelinessIndex}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Pulse indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
            style={{ left: `calc(${stats.lonelinessIndex}% - 8px)` }}
            animate={{
              scale: [1, 1.3, 1],
              boxShadow: [
                "0 0 10px rgba(255,255,255,0.5)",
                "0 0 25px rgba(255,255,255,0.8)",
                "0 0 10px rgba(255,255,255,0.5)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          />
        </div>
        <p className="text-center text-xs text-zinc-600 mt-2">
          {stats.lonelinessIndex.toFixed(1)}% of humanity feels disconnected
        </p>
      </div>
    </motion.div>
  )
}
