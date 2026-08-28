// Interval options offered when starting a subscription. Real-world
// cadences plus one fast option so the auto-restock behavior is actually
// observable without waiting a week - clearly labeled, not hidden.
export const FREQUENCY_OPTIONS = [
  { label: "Weekly", minutes: 7 * 24 * 60 },
  { label: "Every 2 weeks", minutes: 14 * 24 * 60 },
  { label: "Monthly", minutes: 30 * 24 * 60 },
  { label: "Every 5 minutes (demo)", minutes: 5 }
];

export function frequencyLabel(minutes) {
  const match = FREQUENCY_OPTIONS.find((o) => o.minutes === minutes);
  if (match) return match.label;
  if (minutes % (24 * 60) === 0) return `Every ${minutes / (24 * 60)} days`;
  return `Every ${minutes} minutes`;
}
