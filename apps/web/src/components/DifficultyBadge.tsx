import type { Difficulty } from '@vedaai/shared';

type BadgeConfig = { bg: string; text: string; label: string };

const BADGE_CONFIG: Record<Difficulty, BadgeConfig> = {
  easy:        { bg: 'bg-green-100', text: 'text-green-800',  label: 'Easy' },
  moderate:    { bg: 'bg-amber-100', text: 'text-amber-800',  label: 'Moderate' },
  challenging: { bg: 'bg-red-100',   text: 'text-red-800',    label: 'Challenging' },
};

/**
 * DifficultyBadge — pill chip indicating question difficulty.
 *
 * Uses Tailwind built-in palette (green/amber/red) per Figma page 04 tokens.
 * Difficulty type sourced from @vedaai/shared — single source of truth.
 */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { bg, text, label } = BADGE_CONFIG[difficulty];
  return (
    <span
      className={`${bg} ${text} rounded-full px-2 py-0.5 text-p5 font-medium inline-flex items-center`}
    >
      {label}
    </span>
  );
}
