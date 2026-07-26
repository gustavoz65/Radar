/** Fixed gauge geometry: semicircle of radius 50 in a 120x70 viewBox, centred at (60, 60). */
export const GAUGE_RADIUS = 50;
export const GAUGE_ARC_LENGTH = Math.PI * GAUGE_RADIUS;
export const GAUGE_PATH = 'M 10 60 A 50 50 0 0 1 110 60';

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

/** stroke-dashoffset for the filled portion of the arc. */
export function gaugeDashOffset(score: number): number {
  return GAUGE_ARC_LENGTH * (1 - clampScore(score) / 100);
}

export function scoreLabel(score: number): 'Baixa' | 'Moderada' | 'Alta' {
  const value = clampScore(score);
  if (value < 40) return 'Baixa';
  if (value < 70) return 'Moderada';
  return 'Alta';
}
