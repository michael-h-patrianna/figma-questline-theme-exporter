// Utility functions for questline theming plugin

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function hasDoubleWhitespace(str: string): boolean {
  return /\s{2,}/.test(str);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function isInsideBounds(
  x: number,
  y: number,
  w: number,
  h: number,
  parentW: number,
  parentH: number
): boolean {
  return x >= 0 && y >= 0 && x + w <= parentW && y + h <= parentH;
}
