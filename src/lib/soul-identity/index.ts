export type SoulMood = 'electric' | 'serene' | 'melancholic' | 'fiery' | 'calm';

export function generateSoulId() {
  // Lightweight random id for demo; in prod tie to user auth
  return 'soul_' + Math.random().toString(36).slice(2, 12);
}

export function getSoulName() {
  const names = ['Nova', 'Orion', 'Lumen', 'Astra', 'Echo', 'Zephyr', 'Kairo'];
  return names[Math.floor(Math.random() * names.length)];
}

export function generateVibeFrequency() {
  return Math.floor(Math.random() * 1000);
}

export function getSoulMood(): SoulMood {
  const moods: SoulMood[] = ['electric', 'serene', 'melancholic', 'fiery', 'calm'];
  return moods[Math.floor(Math.random() * moods.length)];
}
