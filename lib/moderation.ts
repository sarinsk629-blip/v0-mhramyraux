const AGGRESSIVE_PATTERNS = [
  /\b(kill|die|hurt|attack|hate)\s+(you|yourself|myself|them)/gi,
  /\b(stupid|idiot|dumb|loser|pathetic|worthless)\b/gi,
  /\b(shut up|go away|leave me alone|get lost)\b/gi,
  /\bi('ll|m going to)\s+(hurt|kill|destroy|end)\b/gi,
]

const HARASSMENT_PATTERNS = [
  /\b(stalk|follow|find you|know where|track)\b/gi,
  /send\s*(me\s*)?(pics|photos|nudes|picture)/gi,
  /\b(age|how old|a\/s\/l|asl|where.*live)\b/gi,
  /\b(meet\s*(up|me)|come\s*over|my\s*(place|house))\b/gi,
  /\b(boyfriend|girlfriend|dating|relationship)\?/gi,
]

const SPAM_PATTERNS = [
  /(.)\1{5,}/g,
  /(https?:\/\/[^\s]+)/gi,
  /\b(buy|sell|discount|free money|click here|subscribe)\b/gi,
  /\b(crypto|bitcoin|nft|invest)\b/gi,
]

const YOUTH_SAFETY_PATTERNS = [
  /\b(are you|how old|what('s| is) your age|underage|minor|young)\b/gi,
  /\b(school|grade|homework|parents|mom|dad)\b.*\b(alone|secret|private)\b/gi,
  /\b(don't tell|secret between|our secret|hide this)\b/gi,
]

const SELF_HARM_PATTERNS = [
  /\b(want to die|kill myself|end it all|not worth living)\b/gi,
  /\b(cutting|self.?harm|suicide|overdose)\b/gi,
  /\b(nobody cares|better off without me|give up)\b/gi,
]

export interface ModerationResult {
  flagType: "aggression" | "harassment" | "spam" | "inappropriate" | "underage_concern" | "self_harm" | null
  severity: number
  shouldBlock: boolean
  action: "warning" | "shadow_ban" | "temp_mute" | "none"
  aiConfidence: number
  supportMessage?: string
}

export function moderateMessage(content: string): ModerationResult {
  const lowerContent = content.toLowerCase()

  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(lowerContent)) {
      return {
        flagType: "self_harm",
        severity: 5,
        shouldBlock: false,
        action: "none",
        aiConfidence: 0.85,
        supportMessage: "We care about you. If you're struggling, please reach out to a crisis helpline. You matter.",
      }
    }
  }

  for (const pattern of YOUTH_SAFETY_PATTERNS) {
    if (pattern.test(lowerContent)) {
      return {
        flagType: "underage_concern",
        severity: 4,
        shouldBlock: true,
        action: "shadow_ban",
        aiConfidence: 0.75,
      }
    }
  }

  // Check for harassment
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(lowerContent)) {
      return {
        flagType: "harassment",
        severity: 4,
        shouldBlock: true,
        action: "shadow_ban",
        aiConfidence: 0.8,
      }
    }
  }

  // Check for aggressive content
  for (const pattern of AGGRESSIVE_PATTERNS) {
    if (pattern.test(lowerContent)) {
      return {
        flagType: "aggression",
        severity: 3,
        shouldBlock: false,
        action: "warning",
        aiConfidence: 0.7,
      }
    }
  }

  // Check for spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        flagType: "spam",
        severity: 2,
        shouldBlock: false,
        action: "warning",
        aiConfidence: 0.9,
      }
    }
  }

  return {
    flagType: null,
    severity: 0,
    shouldBlock: false,
    action: "none",
    aiConfidence: 1.0,
  }
}

// Track warning counts per soul (in-memory, refreshed on server restart)
const warningCounts = new Map<string, { count: number; lastWarning: number }>()

export function trackWarning(soulId: string): { shouldBan: boolean; warningCount: number } {
  const now = Date.now()
  const existing = warningCounts.get(soulId) || { count: 0, lastWarning: 0 }

  // Reset count if last warning was more than 24 hours ago
  if (now - existing.lastWarning > 24 * 60 * 60 * 1000) {
    existing.count = 0
  }

  existing.count += 1
  existing.lastWarning = now
  warningCounts.set(soulId, existing)

  // Shadow ban after 3 warnings in 24 hours
  return {
    shouldBan: existing.count >= 3,
    warningCount: existing.count,
  }
}

export function getAuraColor(isShadowBanned: boolean, baseAura: string): string {
  if (isShadowBanned) {
    return "#6b7280" // Grey aura for shadow-banned users
  }
  return baseAura
}
