import { ThemeKey, LinkBtn } from "./contexts/ProjectsContext";

export type TemplateKey = "musician" | "blogger" | "creator";

export const TEMPLATE_META: Record<TemplateKey, { title: string; description: string; theme: ThemeKey }> = {
  musician: { title: "Артист", description: "Тур, релизы и соцсети", theme: "violet" },
  blogger:  { title: "Блогер", description: "Контент и площадки", theme: "ocean" },
  creator:  { title: "Криэйтор", description: "Портфолио и контакты", theme: "forest" },
};

export function buildTemplate(key: TemplateKey): { title: string; description: string; theme: ThemeKey; links: LinkBtn[] } {
  switch (key) {
    case "musician":
      return {
        title: "Мой проект",
        description: "Новые треки, концерты, мерч",
        theme: "violet",
        links: [
          { id: "t1", title: "Instagram", url: "https://instagram.com", icon: "logo-instagram", color: "#E1306C" },
          { id: "t2", title: "YouTube", url: "https://youtube.com", icon: "logo-youtube", color: "#FF0000" },
          { id: "t3", title: "Spotify", url: "https://open.spotify.com", icon: "musical-notes-outline", color: "#1DB954" },
        ],
      };
    case "blogger":
      return {
        title: "Мой проект",
        description: "Где меня найти",
        theme: "ocean",
        links: [
          { id: "t1", title: "TikTok", url: "https://tiktok.com", icon: "logo-tiktok", color: "#111827" },
          { id: "t2", title: "Telegram", url: "https://t.me", icon: "send", color: "#229ED9" },
          { id: "t3", title: "Сайт", url: "https://example.com", icon: "globe-outline", color: "#111827" },
        ],
      };
    default:
      return {
        title: "Мой проект",
        description: "Портфолио и ссылки",
        theme: "forest",
        links: [
          { id: "t1", title: "GitHub", url: "https://github.com", icon: "logo-github", color: "#111827" },
          { id: "t2", title: "LinkedIn", url: "https://linkedin.com", icon: "logo-linkedin", color: "#0A66C2" },
          { id: "t3", title: "Портфолио", url: "https://example.com", icon: "book-outline", color: "#111827" },
        ],
      };
  }
}
