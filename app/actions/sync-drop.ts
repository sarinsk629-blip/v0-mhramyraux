"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface SyncDropStatus {
  isActive: boolean
  startsAt?: string
  endsAt?: string
  totalSoulsVisible: number
  minutesRemaining?: number
}

export async function getSyncDropStatus(): Promise<SyncDropStatus> {
  const now = new Date()

  const { data: activeDrop } = await supabase.from("sync_drops").select("*").eq("status", "active").maybeSingle()

  if (activeDrop) {
    const endTime = new Date(activeDrop.scheduled_at)
    endTime.setMinutes(endTime.getMinutes() + activeDrop.duration_minutes)

    // Check if still active
    if (now < endTime) {
      const minutesRemaining = Math.ceil((endTime.getTime() - now.getTime()) / 60000)
      return {
        isActive: true,
        startsAt: activeDrop.scheduled_at,
        endsAt: endTime.toISOString(),
        totalSoulsVisible: activeDrop.total_souls_visible,
        minutesRemaining,
      }
    } else {
      // Mark as completed
      await supabase.from("sync_drops").update({ status: "completed" }).eq("id", activeDrop.id)
    }
  }

  const { data: pendingDrop } = await supabase
    .from("sync_drops")
    .select("*")
    .eq("status", "pending")
    .gt("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (pendingDrop) {
    return {
      isActive: false,
      startsAt: pendingDrop.scheduled_at,
      totalSoulsVisible: 0,
    }
  }

  return { isActive: false, totalSoulsVisible: 0 }
}

export async function triggerSyncDrop(durationMinutes = 5): Promise<{ success: boolean; dropId?: string }> {
  const scheduledAt = new Date().toISOString()

  const { data, error } = await supabase
    .from("sync_drops")
    .insert({
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to create sync drop:", error)
    return { success: false }
  }

  return { success: true, dropId: data.id }
}

export async function scheduleDailySyncDrop(): Promise<{ scheduledFor: string }> {
  // Random time in the next 24 hours
  const now = new Date()
  const randomHours = Math.floor(Math.random() * 24)
  const randomMinutes = Math.floor(Math.random() * 60)

  const scheduledAt = new Date(now)
  scheduledAt.setHours(now.getHours() + randomHours)
  scheduledAt.setMinutes(randomMinutes)

  await supabase.from("sync_drops").insert({
    scheduled_at: scheduledAt.toISOString(),
    duration_minutes: 5,
    status: "pending",
  })

  return { scheduledFor: scheduledAt.toISOString() }
}

export async function updateSyncDropStats(dropId: string, soulsVisible: number, collisions: number) {
  await supabase
    .from("sync_drops")
    .update({
      total_souls_visible: soulsVisible,
      total_collisions: collisions,
    })
    .eq("id", dropId)
}
