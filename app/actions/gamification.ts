"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: string
  requirement_type: string
  requirement_value: number
  points_reward: number
}

interface Streak {
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  multiplier: number
}

// Update streak and check for badge eligibility
export async function updateStreak(soulId: string): Promise<{
  streak: Streak
  newBadges: Badge[]
  pointsEarned: number
}> {
  const today = new Date().toISOString().split("T")[0]

  // Get current streak
  const { data: existingStreak } = await supabase.from("streaks").select("*").eq("soul_id", soulId).maybeSingle()

  let currentStreak = 1
  let longestStreak = 1
  let multiplier = 1.0

  if (existingStreak) {
    const lastDate = existingStreak.last_activity_date
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    if (lastDate === today) {
      // Already logged today
      return {
        streak: existingStreak,
        newBadges: [],
        pointsEarned: 0,
      }
    } else if (lastDate === yesterday) {
      // Consecutive day
      currentStreak = existingStreak.current_streak + 1
      longestStreak = Math.max(currentStreak, existingStreak.longest_streak)
      // Multiplier increases with streak (caps at 3x)
      multiplier = Math.min(3.0, 1.0 + currentStreak * 0.1)
    } else {
      // Streak broken
      currentStreak = 1
      longestStreak = existingStreak.longest_streak
      multiplier = 1.0
    }

    await supabase
      .from("streaks")
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        multiplier,
        updated_at: new Date().toISOString(),
      })
      .eq("soul_id", soulId)
  } else {
    // Create new streak record
    await supabase.from("streaks").insert({
      soul_id: soulId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
      multiplier: 1.0,
    })
  }

  // Check for streak badges
  const newBadges = await checkAndAwardBadges(soulId, "streak", currentStreak)

  // Award streak bonus points
  const basePoints = 5
  const pointsEarned = Math.floor(basePoints * multiplier)

  await supabase
    .rpc("increment_impact_points", {
      p_soul_id: soulId,
      p_points: pointsEarned,
    })
    .catch(() => {
      // Fallback if RPC doesn't exist
      return supabase.from("impact_points").upsert(
        {
          soul_id: soulId,
          points: pointsEarned,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "soul_id" },
      )
    })

  return {
    streak: {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      multiplier,
    },
    newBadges,
    pointsEarned,
  }
}

// Check and award badges based on achievement
export async function checkAndAwardBadges(
  soulId: string,
  requirementType: string,
  currentValue: number,
): Promise<Badge[]> {
  // Get eligible badges not yet earned
  const { data: eligibleBadges } = await supabase
    .from("badges")
    .select("*")
    .eq("requirement_type", requirementType)
    .lte("requirement_value", currentValue)

  if (!eligibleBadges || eligibleBadges.length === 0) return []

  // Get already earned badges
  const { data: earnedBadges } = await supabase.from("soul_badges").select("badge_id").eq("soul_id", soulId)

  const earnedBadgeIds = new Set(earnedBadges?.map((b) => b.badge_id) || [])

  // Filter to new badges only
  const newBadges = eligibleBadges.filter((b) => !earnedBadgeIds.has(b.id))

  if (newBadges.length === 0) return []

  // Award new badges
  const badgeInserts = newBadges.map((badge) => ({
    soul_id: soulId,
    badge_id: badge.id,
  }))

  await supabase.from("soul_badges").insert(badgeInserts)

  // Award bonus points for each badge
  const totalBonusPoints = newBadges.reduce((sum, b) => sum + b.points_reward, 0)
  if (totalBonusPoints > 0) {
    const { data: currentPoints } = await supabase
      .from("impact_points")
      .select("points")
      .eq("soul_id", soulId)
      .maybeSingle()

    await supabase.from("impact_points").upsert(
      {
        soul_id: soulId,
        points: (currentPoints?.points || 0) + totalBonusPoints,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "soul_id" },
    )
  }

  return newBadges
}

// Get soul's badges and progress
export async function getSoulBadges(soulId: string): Promise<{
  earned: (Badge & { earned_at: string })[]
  available: (Badge & { progress: number })[]
}> {
  // Get all badges
  const { data: allBadges } = await supabase.from("badges").select("*").order("requirement_value", { ascending: true })

  // Get earned badges
  const { data: earnedData } = await supabase.from("soul_badges").select("badge_id, earned_at").eq("soul_id", soulId)

  const earnedMap = new Map(earnedData?.map((e) => [e.badge_id, e.earned_at]) || [])

  // Get soul stats for progress calculation
  const { data: impactPoints } = await supabase
    .from("impact_points")
    .select("points, total_connections, total_messages")
    .eq("soul_id", soulId)
    .maybeSingle()

  const { data: streak } = await supabase.from("streaks").select("current_streak").eq("soul_id", soulId).maybeSingle()

  const stats: Record<string, number> = {
    collisions: impactPoints?.total_connections || 0,
    messages: impactPoints?.total_messages || 0,
    streak: streak?.current_streak || 0,
    impact_points: impactPoints?.points || 0,
  }

  const earned: (Badge & { earned_at: string })[] = []
  const available: (Badge & { progress: number })[] = []

  for (const badge of allBadges || []) {
    if (earnedMap.has(badge.id)) {
      earned.push({ ...badge, earned_at: earnedMap.get(badge.id)! })
    } else {
      const currentValue = stats[badge.requirement_type] || 0
      const progress = Math.min(100, (currentValue / badge.requirement_value) * 100)
      available.push({ ...badge, progress })
    }
  }

  return { earned, available }
}

// Get daily challenge
export async function getDailyChallenge(): Promise<{
  challenge: {
    id: string
    title: string
    description: string
    goal_type: string
    goal_value: number
    reward_points: number
  } | null
  progress: number
  completed: boolean
}> {
  const today = new Date().toISOString().split("T")[0]

  const { data: challenge } = await supabase
    .from("daily_challenges")
    .select("*")
    .eq("challenge_date", today)
    .maybeSingle()

  if (!challenge) {
    return { challenge: null, progress: 0, completed: false }
  }

  return {
    challenge,
    progress: 0,
    completed: false,
  }
}

// Track activity for badge/challenge progress
export async function trackActivity(
  soulId: string,
  activityType: "collision" | "message" | "void_time" | "pulse_interaction" | "zenith_match" | "sync_drop",
  value = 1,
): Promise<{
  newBadges: Badge[]
  pointsEarned: number
}> {
  // Update impact_points counters
  const columnMap: Record<string, string> = {
    collision: "total_connections",
    message: "total_messages",
  }

  if (columnMap[activityType]) {
    const { data: current } = await supabase.from("impact_points").select("*").eq("soul_id", soulId).maybeSingle()

    const updates: Record<string, unknown> = {
      soul_id: soulId,
      updated_at: new Date().toISOString(),
    }

    if (columnMap[activityType] === "total_connections") {
      updates.total_connections = (current?.total_connections || 0) + value
    } else if (columnMap[activityType] === "total_messages") {
      updates.total_messages = (current?.total_messages || 0) + value
    }

    await supabase.from("impact_points").upsert(updates, { onConflict: "soul_id" })
  }

  // Check for new badges
  const requirementTypeMap: Record<string, string> = {
    collision: "collisions",
    message: "messages",
    void_time: "void_time",
    pulse_interaction: "pulse_interactions",
    zenith_match: "zenith_matches",
    sync_drop: "sync_drops",
  }

  const { data: impactPoints } = await supabase.from("impact_points").select("*").eq("soul_id", soulId).maybeSingle()

  const currentValue =
    activityType === "collision"
      ? impactPoints?.total_connections || 0
      : activityType === "message"
        ? impactPoints?.total_messages || 0
        : value

  const newBadges = await checkAndAwardBadges(soulId, requirementTypeMap[activityType], currentValue)

  // Award activity points
  const pointsMap: Record<string, number> = {
    collision: 10,
    message: 1,
    void_time: 2,
    pulse_interaction: 5,
    zenith_match: 15,
    sync_drop: 25,
  }

  const pointsEarned = pointsMap[activityType] || 1

  return { newBadges, pointsEarned }
}
