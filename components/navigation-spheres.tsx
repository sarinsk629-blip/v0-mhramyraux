"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Sphere {
  id: string
  name: string
  description: string
  gradient: string
  hoverEffect: "blackhole" | "heartbeat" | "sunburst"
  route: string
}

const spheres: Sphere[] = [
  {
    id: "void",
    name: "The Void",
    description: "Anonymous healing room",
    gradient: "from-violet-600 via-purple-700 to-violet-900",
    hoverEffect: "blackhole",
    route: "/void",
  },
  {
    id: "pulse",
    name: "The Pulse",
    description: "Daily life-hub",
    gradient: "from-rose-500 via-red-600 to-pink-500",
    hoverEffect: "heartbeat",
    route: "/pulse",
  },
  {
    id: "zenith",
    name: "The Zenith",
    description: "Find love & friendship",
    gradient: "from-amber-400 via-orange-500 to-yellow-300",
    hoverEffect: "sunburst",
    route: "/zenith",
  },
]

export function NavigationSpheres() {
  const [hoveredSphere, setHoveredSphere] = useState<string | null>(null)
  const router = useRouter()

  const handleClick = (route: string) => {
    router.push(route)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 4 }}
      className="relative z-10 flex flex-wrap justify-center gap-8 md:gap-16"
    >
      {spheres.map((sphere, index) => (
        <motion.button
          key={sphere.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 4 + index * 0.2,
            type: "spring",
            stiffness: 200,
          }}
          onHoverStart={() => setHoveredSphere(sphere.id)}
          onHoverEnd={() => setHoveredSphere(null)}
          onClick={() => handleClick(sphere.route)}
          className="relative group cursor-pointer"
        >
          {/* Glass sphere container */}
          <div className="relative w-28 h-28 md:w-36 md:h-36">
            {/* Outer glow ring */}
            <motion.div
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${sphere.gradient} opacity-20 blur-xl`}
              animate={
                hoveredSphere === sphere.id
                  ? sphere.hoverEffect === "blackhole"
                    ? { scale: [1, 2, 0.5], opacity: [0.2, 0.5, 0] }
                    : sphere.hoverEffect === "heartbeat"
                      ? { scale: [1, 1.4, 1, 1.3, 1], opacity: [0.3, 0.6, 0.3, 0.5, 0.3] }
                      : { scale: [1, 1.8, 1.5], opacity: [0.3, 0.8, 0.5], rotate: [0, 180, 360] }
                  : { scale: 1 }
              }
              transition={{
                duration: sphere.hoverEffect === "heartbeat" ? 0.8 : 1.5,
                repeat: hoveredSphere === sphere.id ? Number.POSITIVE_INFINITY : 0,
              }}
            />

            {/* Glass sphere */}
            <motion.div
              className={`relative w-full h-full rounded-full bg-gradient-to-br ${sphere.gradient} p-[2px]`}
              whileHover={{ scale: 1.1 }}
              animate={hoveredSphere === sphere.id && sphere.hoverEffect === "blackhole" ? { rotate: [0, 360] } : {}}
              transition={{
                rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                scale: { type: "spring", stiffness: 300 },
              }}
            >
              {/* Inner glass effect */}
              <div className="w-full h-full rounded-full bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center overflow-hidden">
                {/* Reflection highlight */}
                <div className="absolute top-2 left-4 w-8 h-8 bg-white/10 rounded-full blur-md" />

                {/* Black hole effect for Void */}
                {sphere.hoverEffect === "blackhole" && hoveredSphere === sphere.id && (
                  <motion.div
                    className="absolute inset-4 rounded-full bg-black"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.5, 1] }}
                    transition={{ duration: 0.5 }}
                  />
                )}

                {/* Heartbeat rings for Pulse */}
                {sphere.hoverEffect === "heartbeat" && hoveredSphere === sphere.id && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-rose-500"
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{
                          duration: 1,
                          delay: i * 0.3,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Sunburst rays for Zenith */}
                {sphere.hoverEffect === "sunburst" && hoveredSphere === sphere.id && (
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1 bg-gradient-to-r from-amber-400 to-transparent"
                        style={{
                          height: "150%",
                          transformOrigin: "center top",
                          transform: `rotate(${i * 45}deg) translateX(-50%)`,
                        }}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 0.6, scaleY: 1 }}
                      />
                    ))}
                  </motion.div>
                )}

                {/* Sphere label */}
                <span className="relative z-10 text-xs md:text-sm font-medium text-zinc-300 text-center px-2">
                  {sphere.name}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Description on hover */}
          <motion.p
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-zinc-500 whitespace-nowrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: hoveredSphere === sphere.id ? 1 : 0, y: hoveredSphere === sphere.id ? 0 : -10 }}
          >
            {sphere.description}
          </motion.p>
        </motion.button>
      ))}
    </motion.div>
  )
}
