import { describe, expect, it } from 'vitest';
import { GAUGE_ARC_LENGTH, gaugeDashOffset, scoreLabel } from '@/lib/charts/gauge';

describe('GAUGE_ARC_LENGTH', () => {
  it('is the length of a radius-50 semicircle', () => {
    expect(GAUGE_ARC_LENGTH).toBeCloseTo(Math.PI * 50, 6);
  });
});

describe('gaugeDashOffset', () => {
  it('hides the whole arc at score zero', () => {
    expect(gaugeDashOffset(0)).toBeCloseTo(GAUGE_ARC_LENGTH, 6);
  });

  it('fills the whole arc at score one hundred', () => {
    expect(gaugeDashOffset(100)).toBeCloseTo(0, 6);
  });

  it('fills half the arc at score fifty', () => {
    expect(gaugeDashOffset(50)).toBeCloseTo(GAUGE_ARC_LENGTH / 2, 6);
  });

  it('clamps scores below zero', () => {
    expect(gaugeDashOffset(-20)).toBeCloseTo(GAUGE_ARC_LENGTH, 6);
  });

  it('clamps scores above one hundred', () => {
    expect(gaugeDashOffset(140)).toBeCloseTo(0, 6);
  });
});

describe('scoreLabel', () => {
  it('labels low confidence', () => {
    expect(scoreLabel(0)).toBe('Baixa');
    expect(scoreLabel(39)).toBe('Baixa');
  });

  it('labels moderate confidence', () => {
    expect(scoreLabel(40)).toBe('Moderada');
    expect(scoreLabel(69)).toBe('Moderada');
  });

  it('labels high confidence', () => {
    expect(scoreLabel(70)).toBe('Alta');
    expect(scoreLabel(100)).toBe('Alta');
  });
});
