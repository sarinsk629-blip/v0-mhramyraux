// Generate a unique soul identity based on device fingerprint
export function generateSoulId(): string {
  if (typeof window !== "undefined") {
    const existingId = localStorage.getItem("mharmyraux_soul_id")
    if (existingId) return existingId
  }

  const fp = generateDeviceFingerprint()
  const fpHash = hashFingerprint(fp)

  // Combine fingerprint hash with random component for uniqueness
  const soulId = `soul_${fpHash}_${Date.now().toString(36)}`

  if (typeof window !== "undefined") {
    localStorage.setItem("mharmyraux_soul_id", soulId)
    localStorage.setItem("mharmyraux_fingerprint", JSON.stringify(fp))
  }

  return soulId
}

// Generate comprehensive device fingerprint for human verification
export function generateDeviceFingerprint(): DeviceFingerprint {
  if (typeof window === "undefined") {
    return {
      screenResolution: "unknown",
      colorDepth: 0,
      timezone: "unknown",
      language: "unknown",
      hardwareConcurrency: 0,
      platform: "server",
      touchSupport: false,
      webglVendor: "unknown",
      canvasHash: "unknown",
    }
  }

  // Canvas fingerprint
  let canvasHash = "unknown"
  try {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.textBaseline = "top"
      ctx.font = "14px Arial"
      ctx.fillStyle = "#f60"
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = "#069"
      ctx.fillText("Mharmyraux", 2, 15)
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
      ctx.fillText("Soul", 4, 17)
      canvasHash = canvas.toDataURL().slice(-50)
    }
  } catch {}

  // WebGL vendor
  let webglVendor = "unknown"
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl")
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
      if (debugInfo) {
        webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "unknown"
      }
    }
  } catch {}

  return {
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    platform: navigator.platform || "unknown",
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    webglVendor,
    canvasHash,
  }
}

// Create hash from fingerprint
export function hashFingerprint(fp: DeviceFingerprint): string {
  const str = JSON.stringify(fp)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `fp_${Math.abs(hash).toString(36)}`
}

// Calculate trust score based on fingerprint consistency
export function calculateTrustScore(fp: DeviceFingerprint): number {
  let score = 0.5 // Base score

  // Consistent timezone adds trust
  if (fp.timezone && fp.timezone !== "unknown") score += 0.1

  // Touch support on mobile indicates real device
  if (fp.touchSupport && /mobile|android|iphone/i.test(fp.platform)) score += 0.1

  // WebGL support indicates real browser
  if (fp.webglVendor !== "unknown") score += 0.1

  // Canvas fingerprint available
  if (fp.canvasHash !== "unknown") score += 0.1

  // Hardware concurrency reasonable for real device
  if (fp.hardwareConcurrency >= 2 && fp.hardwareConcurrency <= 32) score += 0.1

  return Math.min(1, score)
}

// Generate a mystical soul name
export function generateSoulName(): string {
  const prefixes = [
    "Ethereal",
    "Cosmic",
    "Radiant",
    "Mystic",
    "Astral",
    "Luminous",
    "Phantom",
    "Celestial",
    "Void",
    "Shadow",
  ]
  const suffixes = ["Wanderer", "Seeker", "Dreamer", "Walker", "Weaver", "Seer", "Keeper", "Spirit", "Echo", "Flame"]

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  const number = Math.floor(Math.random() * 999) + 1

  return `${prefix} ${suffix} #${number}`
}

export function generateVibeFrequency(): number {
  return Math.random()
}

export function getSoulName(): string {
  if (typeof window !== "undefined") {
    const existingName = localStorage.getItem("mharmyraux_soul_name")
    if (existingName) return existingName

    const newName = generateSoulName()
    localStorage.setItem("mharmyraux_soul_name", newName)
    return newName
  }
  return generateSoulName()
}

export function calculateVibeMatch(freq1: number, freq2: number): number {
  return Math.round((1 - Math.abs(freq1 - freq2)) * 100)
}

export type SoulMood = "radiant" | "calm" | "seeking" | "healing" | "electric" | "neutral"

export function getSoulMood(): SoulMood {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("mharmyraux_mood") as SoulMood) || "neutral"
  }
  return "neutral"
}

export function setSoulMood(mood: SoulMood): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("mharmyraux_mood", mood)
  }
}

export type AuraType = "basic" | "ethereal" | "cosmic" | "phoenix" | "void_master" | "zenith_legend"

export function getSoulAura(): AuraType {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("mharmyraux_aura") as AuraType) || "basic"
  }
  return "basic"
}

export function setSoulAura(aura: AuraType): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("mharmyraux_aura", aura)
  }
}

export interface DeviceFingerprint {
  screenResolution: string
  colorDepth: number
  timezone: string
  language: string
  hardwareConcurrency: number
  platform: string
  touchSupport: boolean
  webglVendor: string
  canvasHash: string
}
