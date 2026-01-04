// All amounts are in paise (integer) to avoid floating point issues.
// E.g., ₹100 => 10000 paise
export function applySatisfactionPenalty(amountPaise: number, satisfactionPercent: number) {
  const sat = Math.max(0, Math.min(100, Math.round(satisfactionPercent)));
  // No penalty if satisfaction >= 90
  if (sat >= 90) {
    return {
      payoutToUserPaise: amountPaise,
      adminCutPaise: 0,
    };
  }

  // For every full 10% drop below 90%, deduct ₹3 (300 paise)
  const drop = 90 - sat;
  const tens = Math.floor(drop / 10);
  const deductionPaise = tens * 300; // ₹3 => 300 paise per 10% block

  const adminCutPaise = Math.min(deductionPaise, amountPaise);
  const payoutToUserPaise = Math.max(0, amountPaise - adminCutPaise);

  return {
    payoutToUserPaise,
    adminCutPaise,
  };
}
