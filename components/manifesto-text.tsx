"use client"

import { motion } from "framer-motion"

const manifestoLines = ["The end of the void.", "Where souls don't scroll—", "they collide."]

export function ManifestoText() {
  return (
    <div className="relative z-10 text-center space-y-4">
      {manifestoLines.map((line, index) => (
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.2,
            delay: index * 0.8 + 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="text-2xl md:text-4xl lg:text-5xl font-light tracking-wide"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #a8b5c4 50%, #6ee7b7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 0 40px rgba(110, 231, 183, 0.3)",
          }}
        >
          {line}
        </motion.p>
      ))}
    </div>
  )
}
