import type { Project, ThemeKey } from "./contexts/ProjectsContext";

export type TemplateKey = "musician" | "blogger" | "shop" | "coach" | "streamer";

export const TEMPLATE_META: Record<TemplateKey, { title: string; theme: ThemeKey; description: string }> = {
  musician: { title: "Профиль артиста", theme: "ocean",  description: "Новые релизы и соцсети" },
  blogger:  { title: "Блогер / инфлюенсер", theme: "violet", description: "Контент и партнёрки" },
  shop:     { title: "Магазин/бренд", theme: "forest", description: "Каталог и покупка" },
  coach:    { title: "Эксперт / коуч", theme: "sunset", description: "Материалы и запись" },
  streamer: { title: "Стример", theme: "dark", description: "Стрим-сервисы и донаты" },
};

export function buildTemplate(key: TemplateKey) {
  switch (key) {
    case "musician":
      return {
        title: "Мой релиз",
        description: "Слушай на платформах",
        theme: "ocean" as ThemeKey,
        links: [
          { id: String(Date.now()+1), title: "YouTube",  url: "youtube.com/@yourname", icon: "logo-youtube",  badge: "NEW", color: "#EF4444" },
          { id: String(Date.now()+2), title: "Spotify",  url: "open.spotify.com/artist/...", icon: "musical-notes-outline", color: "#10B981" },
          { id: String(Date.now()+3), title: "Instagram", url: "instagram.com/yourname", icon: "logo-instagram", color: "#DB2777" },
        ],
      };
    case "blogger":
      return {
        title: "Всем привет 👋",
        description: "Мои соцсети и подборки",
        theme: "violet" as ThemeKey,
        links: [
          { id: String(Date.now()+1), title: "Telegram", url: "t.me/yourname", icon: "send", color: "#0EA5E9" },
          { id: String(Date.now()+2), title: "YouTube",  url: "youtube.com/@yourname", icon: "logo-youtube", color: "#EF4444" },
          { id: String(Date.now()+3), title: "Сайт",     url: "yourdomain.com", icon: "globe-outline", badge: "BLOG", color: "#111827" },
        ],
      };
    case "shop":
      return {
        title: "Бренд одежды",
        description: "Новинки и заказ",
        theme: "forest" as ThemeKey,
        links: [
          { id: String(Date.now()+1), title: "Каталог", url: "yourshop.com/catalog", icon: "storefront-outline", badge: "NEW", color: "#111827" },
          { id: String(Date.now()+2), title: "Instagram", url: "instagram.com/yourbrand", icon: "logo-instagram", color: "#DB2777" },
          { id: String(Date.now()+3), title: "WhatsApp", url: "wa.me/1234567890", icon: "logo-whatsapp", color: "#16A34A" },
        ],
      };
    case "coach":
      return {
        title: "Эксперт",
        description: "Материалы и запись",
        theme: "sunset" as ThemeKey,
        links: [
          { id: String(Date.now()+1), title: "Запись на сессию", url: "cal.com/yourname", icon: "calendar-outline", badge: "OPEN", color: "#F59E0B" },
          { id: String(Date.now()+2), title: "YouTube", url: "youtube.com/@yourname", icon: "logo-youtube", color: "#EF4444" },
          { id: String(Date.now()+3), title: "Telegram", url: "t.me/yourname", icon: "send", color: "#0EA5E9" },
        ],
      };
    case "streamer":
      return {
        title: "Стримы здесь",
        description: "Подписка и донаты",
        theme: "dark" as ThemeKey,
        links: [
          { id: String(Date.now()+1), title: "Twitch", url: "twitch.tv/yourname", icon: "game-controller-outline", color: "#6D28D9" },
          { id: String(Date.now()+2), title: "YouTube", url: "youtube.com/@yourname", icon: "logo-youtube", color: "#EF4444" },
          { id: String(Date.now()+3), title: "Донаты", url: "donatepay.ru/...", icon: "card-outline", color: "#111827" },
        ],
      };
  }
}
