// Edge Function for Resonance Matching - runs in the city closest to the user
export const runtime = "edge"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

interface PresenceUser {
  soul_id: string
  soul_name: string
  vibe_frequency: number
  sphere: string
  latitude: number
  longitude: number
  status: string
  last_ping: string
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const { soulId, vibeFrequency, sphere, latitude, longitude } = await request.json()

    // Find matching souls within frequency range (±0.15) who are also seeking
    const frequencyMin = vibeFrequency - 0.15
    const frequencyMax = vibeFrequency + 0.15

    const { data: candidates, error } = await supabase
      .from("presence")
      .select("*")
      .eq("sphere", sphere)
      .eq("status", "seeking")
      .neq("soul_id", soulId)
      .gte("vibe_frequency", frequencyMin)
      .lte("vibe_frequency", frequencyMax)
      .gte("last_ping", new Date(Date.now() - 30000).toISOString()) // Active in last 30s
      .limit(10)

    if (error) throw error

    if (!candidates || candidates.length === 0) {
      return Response.json({
        matched: false,
        message: "No resonant souls found",
        processingTime: Date.now() - startTime,
      })
    }

    // Calculate resonance score based on frequency match and geographic proximity
    const scoredCandidates = (candidates as PresenceUser[]).map((candidate) => {
      const frequencyDiff = Math.abs(candidate.vibe_frequency - vibeFrequency)
      const frequencyScore = 1 - frequencyDiff / 0.15

      // Calculate distance (simplified haversine)
      let distanceScore = 1
      if (latitude && longitude && candidate.latitude && candidate.longitude) {
        const R = 6371 // Earth radius in km
        const dLat = ((candidate.latitude - latitude) * Math.PI) / 180
        const dLon = ((candidate.longitude - longitude) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((latitude * Math.PI) / 180) *
            Math.cos((candidate.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c
        // Favor closer souls (within 1000km gets bonus)
        distanceScore = Math.max(0, 1 - distance / 10000)
      }

      const resonanceScore = frequencyScore * 0.7 + distanceScore * 0.3

      return { ...candidate, resonanceScore }
    })

    // Sort by resonance score and pick the best match
    scoredCandidates.sort((a, b) => b.resonanceScore - a.resonanceScore)
    const bestMatch = scoredCandidates[0]

    // Generate unique room ID
    const roomId = `collision_${[soulId, bestMatch.soul_id].sort().join("_")}_${Date.now()}`

    // Update both users' status
    await Promise.all([
      supabase.from("presence").update({ status: "colliding" }).eq("soul_id", soulId),
      supabase.from("presence").update({ status: "colliding" }).eq("soul_id", bestMatch.soul_id),
    ])

    // Create collision record
    await supabase.from("collisions").insert({
      soul_a: soulId,
      soul_b: bestMatch.soul_id,
      sphere,
      room_id: roomId,
      status: "active",
      transparency_level: 0,
      total_characters: 0,
    })

    return Response.json({
      matched: true,
      partner: {
        soulId: bestMatch.soul_id,
        soulName: bestMatch.soul_name,
        vibeFrequency: bestMatch.vibe_frequency,
        resonanceScore: bestMatch.resonanceScore,
      },
      roomId,
      processingTime: Date.now() - startTime,
      edgeLocation: request.headers.get("x-vercel-ip-city") || "unknown",
    })
  } catch (error) {
    console.error("Resonance matching error:", error)
    return Response.json(
      { error: "Resonance matching failed", processingTime: Date.now() - startTime },
      { status: 500 },
    )
  }
}
