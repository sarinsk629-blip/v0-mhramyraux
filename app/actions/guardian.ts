"use server"

import { createClient } from "@supabase/supabase-js"
import { moderateMessage, trackWarning } from "@/lib/moderation"

// Server-side Supabase client with service role for admin operations
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export interface GuardianAnalysis {
  safe: boolean
  flagType: string | null
  action: string
  auraColor: string
  supportMessage?: string
}

export async function analyzeMessage(soulId: string, messageContent: string): Promise<GuardianAnalysis> {
  // Run moderation
  const result = moderateMessage(messageContent)

  // Default response
  let response: GuardianAnalysis = {
    safe: true,
    flagType: null,
    action: "none",
    auraColor: "#a78bfa", // Default violet
  }

  if (result.flagType) {
    // Track warning and check if should ban
    const { shouldBan, warningCount } = trackWarning(soulId)

    // Log to guardian_reports
    await supabase.from("guardian_reports").insert({
      reported_soul_id: soulId,
      report_type: result.flagType,
      ai_analysis: JSON.stringify(result),
      ai_confidence: result.aiConfidence,
      action_taken: shouldBan ? "shadow_ban" : result.action,
    })

    if (shouldBan || result.action === "shadow_ban") {
      // Apply shadow ban
      await supabase.from("shadow_bans").upsert(
        {
          soul_id: soulId,
          reason: result.flagType,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "soul_id" },
      )

      // Update soul's shadow ban status and grey aura
      await supabase.from("souls").update({ is_shadow_banned: true }).eq("soul_id", soulId)

      response = {
        safe: false,
        flagType: result.flagType,
        action: "shadow_ban",
        auraColor: "#6b7280", // Grey - warns others
        supportMessage: result.supportMessage,
      }
    } else if (result.action === "warning") {
      response = {
        safe: false,
        flagType: result.flagType,
        action: `warning_${warningCount}`,
        auraColor: warningCount >= 2 ? "#9ca3af" : "#a78bfa", // Dimmed aura after 2 warnings
        supportMessage: result.supportMessage,
      }
    } else if (result.flagType === "self_harm") {
      // Special handling - don't punish, provide support
      response = {
        safe: false,
        flagType: result.flagType,
        action: "support",
        auraColor: "#a78bfa",
        supportMessage: result.supportMessage,
      }
    }
  }

  return response
}

export async function checkShadowBan(soulId: string): Promise<{ banned: boolean; reason?: string }> {
  const { data } = await supabase
    .from("shadow_bans")
    .select("*")
    .eq("soul_id", soulId)
    .gt("expires_at", new Date().toISOString())
    .single()

  return {
    banned: !!data,
    reason: data?.reason,
  }
}

export async function liftExpiredBans(): Promise<number> {
  const { data } = await supabase.from("shadow_bans").delete().lt("expires_at", new Date().toISOString()).select()

  // Update souls table
  if (data && data.length > 0) {
    const soulIds = data.map((ban) => ban.soul_id)
    await supabase.from("souls").update({ is_shadow_banned: false }).in("soul_id", soulIds)
  }

  return data?.length || 0
}
