"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { generateSoulId, getSoulName } from "@/lib/soul-identity"
import { moderateMessage, trackWarning } from "@/lib/moderation"
import { X, Send, AlertTriangle } from "lucide-react"

interface Message {
  id: string
  content: string
  sender_soul_id: string
  created_at: string
}

interface TransparencyChatProps {
  roomId: string
  sphere: "void" | "pulse" | "zenith"
  matchedSoul: { name: string; matchScore: number }
  onClose: () => void
}

const MAX_BLUR = 20 // Maximum blur in pixels
const CHARS_FOR_CLEAR = 500 // Characters needed to fully clear

export function TransparencyChat({ roomId, sphere, matchedSoul, onClose }: TransparencyChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [totalChars, setTotalChars] = useState(0)
  const [warning, setWarning] = useState<string | null>(null)
  const [impactPoints, setImpactPoints] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const soulId = generateSoulId()
  const soulName = getSoulName()

  // Calculate blur level based on total characters exchanged
  const blurLevel = Math.max(0, MAX_BLUR - (totalChars / CHARS_FOR_CLEAR) * MAX_BLUR)
  const transparencyPercent = Math.min(100, Math.round((totalChars / CHARS_FOR_CLEAR) * 100))

  // Fetch messages and subscribe
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })

      if (data) {
        setMessages(data as Message[])
        const chars = data.reduce((sum, m) => sum + m.content.length, 0)
        setTotalChars(chars)
      }
    }

    fetchMessages()

    // Update collision total_characters
    const updateCollision = async () => {
      await supabase
        .from("collisions")
        .update({
          total_characters: totalChars,
          transparency_level: transparencyPercent / 100,
        })
        .eq("room_id", roomId)
    }
    updateCollision()

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
          setTotalChars((prev) => prev + newMessage.content.length)

          // Haptic on receiving message
          if (newMessage.sender_soul_id !== soulId && navigator.vibrate) {
            navigator.vibrate(30)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, soulId, totalChars, transparencyPercent])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return

    // AI Guardian moderation
    const modResult = moderateMessage(input)

    if (modResult.shouldBlock) {
      setWarning("Message blocked by AI Guardian for safety")

      // Log moderation flag
      await supabase.from("moderation_flags").insert({
        soul_id: soulId,
        flag_type: modResult.flagType,
        severity: modResult.severity,
        action_taken: modResult.action,
      })

      // Check if should shadow ban
      if (trackWarning(soulId)) {
        await supabase.from("shadow_bans").insert({
          soul_id: soulId,
          reason: modResult.flagType,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      setTimeout(() => setWarning(null), 3000)
      return
    }

    if (modResult.action === "warning") {
      setWarning("Please keep the conversation positive")
      setTimeout(() => setWarning(null), 3000)
    }

    // Send message
    await supabase.from("messages").insert({
      room_id: roomId,
      sender_soul_id: soulId,
      content: input.trim(),
      sphere,
    })

    // Award impact points
    const points = Math.ceil(input.length / 10)
    setImpactPoints((p) => p + points)

    await supabase.from("impact_points").upsert(
      {
        soul_id: soulId,
        points: impactPoints + points,
        total_messages: messages.filter((m) => m.sender_soul_id === soulId).length + 1,
      },
      { onConflict: "soul_id" },
    )

    // Haptic on send
    if (navigator.vibrate) navigator.vibrate(20)

    setInput("")
  }, [input, roomId, sphere, soulId, impactPoints, messages, supabase])

  const handleClose = async () => {
    // Update collision as ended
    await supabase
      .from("collisions")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("room_id", roomId)

    // Update presence
    await supabase.from("presence").update({ status: "active" }).eq("soul_id", soulId)

    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Blurred background */}
      <motion.div
        className="absolute inset-0 bg-black/80"
        style={{ backdropFilter: `blur(${blurLevel}px)` }}
        animate={{ backdropFilter: `blur(${blurLevel}px)` }}
        transition={{ duration: 0.5 }}
      />

      {/* Chat container */}
      <motion.div
        className="relative w-full max-w-lg h-[600px] bg-zinc-950/90 backdrop-blur-xl rounded-2xl border border-zinc-800 flex flex-col overflow-hidden"
        layoutId="chat-window"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h3 className="font-semibold text-white">{matchedSoul.name}</h3>
            <p className="text-xs text-zinc-400">
              Vibe Match: {matchedSoul.matchScore}% | Transparency: {transparencyPercent}%
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-amber-400">+{impactPoints} pts</span>
            <button onClick={handleClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Transparency bar */}
        <div className="px-4 py-2 bg-zinc-900/50">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Blur</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    sphere === "void"
                      ? "linear-gradient(90deg, #8b5cf6, #a78bfa)"
                      : sphere === "pulse"
                        ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                        : "linear-gradient(90deg, #fbbf24, #fcd34d)",
                }}
                animate={{ width: `${transparencyPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span>Clear</span>
          </div>
        </div>

        {/* Warning toast */}
        <AnimatePresence>
          {warning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 bg-amber-500/20 border border-amber-500/50 rounded-lg p-3 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-200">{warning}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_soul_id === soulId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender_soul_id === soulId
                    ? sphere === "void"
                      ? "bg-violet-600 text-white"
                      : sphere === "pulse"
                        ? "bg-rose-600 text-white"
                        : "bg-amber-500 text-black"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Send a message..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <motion.button
              onClick={sendMessage}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl ${
                sphere === "void"
                  ? "bg-violet-600 hover:bg-violet-500"
                  : sphere === "pulse"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-amber-500 hover:bg-amber-400"
              }`}
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
