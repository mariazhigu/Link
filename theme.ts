// theme.ts
export type Palette = {
  bg: string;
  card: string;
  border: string;
  glass: string;
  text: string;
  textMuted: string;
  accent: string;
  accentFg: string;
  accentGlass: string;
  success: string;
  destructive: string;
};

export const palettes: Record<string, Palette> = {
  // ☕️ Light Latte
  latte: {
    bg: '#f6f0e8',
    card: '#ffffff',
    border: '#e8e2d9',
    glass: 'rgba(0,0,0,0.06)',
    text: '#3f3a36',
    textMuted: '#7a6a61',
    accent: '#b07a5e',
    accentFg: '#ffffff',
    accentGlass: 'rgba(176,122,94,0.16)',
    success: '#22c55e',
    destructive: '#dc2626',
  },
  // 🔵 Sapphire
  sapphire: {
    bg: '#0a0f1a',
    card: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)',
    glass: 'rgba(255,255,255,0.10)',
    text: '#e5e7eb',
    textMuted: '#94a3b8',
    accent: '#60a5fa',
    accentFg: '#0b1220',
    accentGlass: 'rgba(96,165,250,0.20)',
    success: '#22c55e',
    destructive: '#ef4444',
  },
  // 💜 Violet
  violet: {
    bg: '#0b1220',
    card: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)',
    glass: 'rgba(255,255,255,0.10)',
    text: '#e5e7eb',
    textMuted: '#94a3b8',
    accent: '#7c3aed',
    accentFg: '#ffffff',
    accentGlass: 'rgba(167,139,250,0.20)',
    success: '#22c55e',
    destructive: '#ef4444',
  },
};

export function getPalette(key?: string): Palette {
  if (!key) return palettes.latte;
  return palettes[key] ?? palettes.latte;
}
