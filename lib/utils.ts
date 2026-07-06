import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Largest-remainder rounding — displayed integers always sum to 100 */
export function displayInts(weights: number[]): number[] {
  const floors = weights.map(Math.floor);
  let rem = 100 - floors.reduce((a, b) => a + b, 0);
  const order = weights
    .map((v, i) => ({ i, f: v - Math.floor(v) }))
    .sort((a, b) => b.f - a.f);
  const out = [...floors];
  for (let k = 0; k < rem; k++) out[order[k % order.length].i]++;
  return out;
}

/** Rebalance weights so they sum to 100 after changing index i to newVal */
export function rebalanceWeights(weights: number[], i: number, newVal: number): number[] {
  const w = [...weights];
  const nv = Math.max(0, Math.min(100, newVal));
  const otherSum = w.reduce((a, b, j) => (j === i ? a : a + b), 0);
  const remaining = 100 - nv;
  if (otherSum <= 0.001) {
    const each = remaining / (w.length - 1);
    return w.map((v, j) => (j === i ? nv : each));
  }
  return w.map((v, j) => (j === i ? nv : (v / otherSum) * remaining));
}

export function bandForScore(score: number) {
  if (score >= 88) return { color: '#059669', bg: '#ecfdf5', bd: '#a7f3d0', label: 'HIGH MATCH' };
  if (score >= 78) return { color: '#10b981', bg: '#f0fdf4', bd: '#bbf7d0', label: 'STRONG' };
  return { color: '#d97706', bg: '#fffbeb', bd: '#fde68a', label: 'REVIEW' };
}

/** SVG circle circumference for ring progress */
export const RING_C = 150.796; // 2π×24
export const RING_C2 = 188.5; // 2π×30 (larger drawer ring)

export function ringOffset(score: number, c = RING_C) {
  return c * (1 - score / 100);
}
