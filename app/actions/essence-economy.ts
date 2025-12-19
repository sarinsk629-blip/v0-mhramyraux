"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface EssenceBalance {
  points: number
  aura: string
  hasBoost: boolean
  boostExpiresAt?: string
}

export async function getEssenceBalance(soulId: string): Promise<EssenceBalance> {
  const { data: soul } = await supabase
    .from("souls")
    .select("impact_points, aura_type, frequency_boost_until")
    .eq("soul_id", soulId)
    .single()

  const now = new Date()
  const hasBoost = soul?.frequency_boost_until ? new Date(soul.frequency_boost_until) > now : false

  return {
    points: soul?.impact_points || 0,
    aura: soul?.aura_type || "basic",
    hasBoost,
    boostExpiresAt: soul?.frequency_boost_until,
  }
}

export async function awardImpactPoints(
  soulId: string,
  amount: number,
  reason: "collision_bonus" | "kindness_bonus" | "message_bonus",
): Promise<{ newBalance: number }> {
  // Get current balance
  const { data: soul } = await supabase.from("souls").select("impact_points").eq("soul_id", soulId).single()

  const currentPoints = soul?.impact_points || 0
  const newBalance = currentPoints + amount

  // Update balance
  await supabase.from("souls").update({ impact_points: newBalance }).eq("soul_id", soulId)

  // Log transaction
  await supabase.from("essence_transactions").insert({
    soul_id: soulId,
    transaction_type: "earn",
    amount,
    item_type: reason,
  })

  return { newBalance }
}

export async function purchaseAura(
  soulId: string,
  auraName: string,
): Promise<{ success: boolean; message: string; newBalance?: number }> {
  // Get aura details
  const { data: aura } = await supabase.from("premium_auras").select("*").eq("name", auraName).single()

  if (!aura) {
    return { success: false, message: "Aura not found" }
  }

  // Get soul balance
  const { data: soul } = await supabase.from("souls").select("impact_points").eq("soul_id", soulId).single()

  const currentPoints = soul?.impact_points || 0

  if (currentPoints < aura.cost) {
    return { success: false, message: `Not enough points. Need ${aura.cost}, have ${currentPoints}` }
  }

  // Deduct points and update aura
  const newBalance = currentPoints - aura.cost

  await supabase
    .from("souls")
    .update({
      impact_points: newBalance,
      aura_type: auraName.toLowerCase().replace(/\s+/g, "_"),
    })
    .eq("soul_id", soulId)

  // Log transaction
  await supabase.from("essence_transactions").insert({
    soul_id: soulId,
    transaction_type: "spend",
    amount: -aura.cost,
    item_type: "aura",
    item_value: auraName,
  })

  return { success: true, message: `Unlocked ${auraName}!`, newBalance }
}

export async function purchaseFrequencyBoost(
  soulId: string,
  durationMinutes: number,
): Promise<{ success: boolean; message: string; expiresAt?: string }> {
  const costPerMinute = 10
  const cost = durationMinutes * costPerMinute

  // Get soul balance
  const { data: soul } = await supabase.from("souls").select("impact_points").eq("soul_id", soulId).single()

  const currentPoints = soul?.impact_points || 0

  if (currentPoints < cost) {
    return { success: false, message: `Not enough points. Need ${cost} for ${durationMinutes}min boost` }
  }

  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()

  // Update soul
  await supabase
    .from("souls")
    .update({
      impact_points: currentPoints - cost,
      frequency_boost_until: expiresAt,
    })
    .eq("soul_id", soulId)

  // Create boost record
  await supabase.from("frequency_boosts").insert({
    soul_id: soulId,
    boost_multiplier: 2.0,
    expires_at: expiresAt,
  })

  // Log transaction
  await supabase.from("essence_transactions").insert({
    soul_id: soulId,
    transaction_type: "spend",
    amount: -cost,
    item_type: "frequency_boost",
    item_value: `${durationMinutes}min`,
  })

  return { success: true, message: `Boosted for ${durationMinutes} minutes!`, expiresAt }
}

export async function getAvailableAuras() {
  const { data } = await supabase.from("premium_auras").select("*").order("cost", { ascending: true })

  return data || []
}
