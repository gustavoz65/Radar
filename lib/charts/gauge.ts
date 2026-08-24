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

export interface GaugeTick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Scale marks every 10 points, drawn *inside* the arc: outside, the marks at 0
 * and 100 would leave the 120x70 viewBox. Every fifth is longer, so the reader
 * can find the halfway point without counting.
 */
export const GAUGE_TICKS: GaugeTick[] = Array.from({ length: 11 }, (_, step) => {
  const radians = Math.PI - (step / 10) * Math.PI;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const inner = step % 5 === 0 ? 37 : 40;

  return {
    x1: 60 + cos * inner,
    y1: 60 - sin * inner,
    x2: 60 + cos * 44,
    y2: 60 - sin * 44,
  };
});
