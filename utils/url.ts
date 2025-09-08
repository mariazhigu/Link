// utils/url.ts
export function normalizeUrl(input?: string): string {
  const raw = (input ?? '').trim();
  if (!raw) return '';
  if (/^(mailto:|tel:)/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export function isLikelyUrl(input?: string): boolean {
  const raw = (input ?? '').trim();
  if (!raw) return false;
  if (/^(mailto:|tel:)/i.test(raw)) return true;
  try {
    const u = new URL(normalizeUrl(raw));
    // минимальная проверка хоста
    return !!u.hostname && (u.hostname.includes('.') || u.hostname === 'localhost');
  } catch {
    return false;
  }
}
