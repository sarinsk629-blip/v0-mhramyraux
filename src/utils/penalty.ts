/**
 * Compute final payout split and admin penalty.
 * - amountInPaise: total amount received (in paise)
 * - satisfactionPercent: integer 0..100
 * Rules:
 * - If satisfaction >= 90: no penalty. Split remaining amount 50/50 between user and host.
 * - For each 10% drop below 90%, deduct ₹3 (300 paise) and route to admin balance.
 * - Penalty cannot exceed the total amount; floors at 0.
 */
export function computePayout(amountInPaise: number, satisfactionPercent: number) {
  const threshold = 90
  let penaltyPaise = 0
  if (satisfactionPercent < threshold) {
    const drop = threshold - satisfactionPercent // e.g. 25
    const tens = Math.floor(drop / 10) // each 10% chunk
    penaltyPaise = tens * 300 // 300 paise = ₹3 per 10%
    if (penaltyPaise > amountInPaise) penaltyPaise = amountInPaise
  }

  const remainder = Math.max(0, amountInPaise - penaltyPaise)
  const userShare = Math.floor(remainder / 2)
  const hostShare = remainder - userShare

  return {
    adminShare: penaltyPaise,
    userShare,
    hostShare,
  }
}
