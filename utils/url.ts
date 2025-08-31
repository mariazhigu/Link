export const BRAND_HINTS: Record<string, string> = {
  instagram: "https://instagram.com/username",
  youtube: "https://youtube.com/@channel",
  tiktok: "https://tiktok.com/@username",
  telegram: "https://t.me/username",
  github: "https://github.com/username",
  linkedin: "https://linkedin.com/in/username",
};

export function normalizeUrl(u: string) {
  if (!u) return "#";
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

export function isValidUrl(u: string) {
  try {
    const x = normalizeUrl(u);
    const url = new URL(x);
    return !!url.host;
  } catch {
    return false;
  }
}
