// contexts/ProjectsContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { useUser } from "./UserContext";

export type LinkBtn = {
  id: string;
  kind?: "link" | "heading" | "divider";
  title?: string;
  url?: string;
  icon?: string;           // "link-outline" или "fa5:spotify"
  color?: string;          // "#111827" или "outline:#111827"
  shape?: "pill" | "rounded" | "square";
  shadow?: boolean;
  visibility?: { startAt?: string; endAt?: string };
  clicks?: number;
};

export type Project = {
  id: string;
  ownerId?: string | null;
  title: string;
  description?: string;

  headerType?: "avatar" | "cover";
  avatarUri?: string;
  avatarShape?: "circle" | "rounded" | "square";
  avatarSize?: number;
  avatarBorderWidth?: number;
  avatarBorderColor?: string;

  coverUri?: string;
  coverHeight?: number;
  coverOverlay?: number;

  bgType?: "gradient" | "solid" | "image";
  bgValue?: string;

  // типографика
  fontKey?: "system" | "inter" | "montserrat" | "playfair";
  titleSize?: number;
  descSize?: number;
  buttonSize?: number;

  links: LinkBtn[];

  publicSlug?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ---- внутренняя утилита хранения ----
const LS_PROJECTS = "linkpro:projects";
const LS_CLICKS_PREFIX = "linkpro:clicks:"; // + projectId

type DailyCache = Record<string, number>; // {"2025-08-31": 4, ...}

function todayKey(d: Date = new Date()) {
  // YYYY-MM-DD в локальной зоне
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function daysBackLabels(n: number) {
  const labels: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(String(d.getDate()).padStart(2, "0")); // показываем только число (для мини-графика)
  }
  return labels;
}

// ---- контекст ----
type Ctx = {
  projects: Project[];
  getProject: (id: string) => Project | undefined;
  refresh: () => Promise<void>;
  createProject: (title?: string) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setLinksOrder: (id: string, links: LinkBtn[]) => Promise<void>;
  registerClick: (projectId: string, linkId: string) => Promise<void>;
  getDailyClicks: (projectId: string, days: number) => { labels: string[]; counts: number[] };
  preloadDailyClicks: (projectId: string, days: number) => void;
  getPublicUrl: (p: Project) => string;
};

const ProjectsContext = createContext<Ctx | null>(null);

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used inside ProjectsProvider");
  return ctx;
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dailyCache, setDailyCache] = useState<Record<string, DailyCache>>({}); // per projectId

  // ---------- helpers ----------
  const persistLocal = async (list: Project[]) => {
    setProjects(list);
    await AsyncStorage.setItem(LS_PROJECTS, JSON.stringify(list));
  };

  const loadLocal = async (): Promise<Project[]> => {
    const raw = await AsyncStorage.getItem(LS_PROJECTS);
    if (!raw) return [];
    try { return JSON.parse(raw) as Project[]; } catch { return []; }
  };

  // Supabase: используем 1 таблицу c JSON-полем (без миграций всё равно будет fallback на локальное)
  // Ожидаемая таблица: linkpro_projects(id uuid/text, owner_id text, payload jsonb, public_slug text, created_at timestamptz, updated_at timestamptz)
  const table = "linkpro_projects";

  const fromRow = (r: any): Project => {
    const p: Project = { ...(r?.payload || {}), id: r?.id || r?.payload?.id };
    if (!p.id) p.id = r?.id || String(Date.now());
    return p;
  };
  const toRow = (p: Project) => ({
    id: p.id,
    owner_id: p.ownerId || user?.id || null,
    public_slug: p.publicSlug || null,
    payload: p,
    updated_at: new Date().toISOString(),
  });

  // ---------- refresh ----------
  const refresh = useCallback(async () => {
    // 1) пробуем загрузить из Supabase
    if (user && supabase) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("owner_id", user.id)
          .order("updated_at", { ascending: false });
        if (!error && data) {
          const list = data.map(fromRow);
          await persistLocal(list);
          return;
        }
      } catch { /* ignore */ }
    }
    // 2) иначе — локально
    const list = await loadLocal();
    setProjects(list);
  }, [user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  // ---------- CRUD ----------
  const createProject = useCallback(async (title = "Новый проект"): Promise<Project> => {
    const p: Project = {
      id: String(Date.now()),
      ownerId: user?.id || null,
      title,
      description: "",
      headerType: "avatar",
      avatarShape: "circle",
      avatarSize: 90,
      avatarBorderWidth: 0,
      coverHeight: 150,
      coverOverlay: 0.25,
      bgType: "gradient",
      bgValue: "ocean",
      fontKey: "system",
      titleSize: 18,
      descSize: 14,
      buttonSize: 14,
      links: [],
      publicSlug: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = [p, ...projects];
    await persistLocal(next);

    // попытка сохранить в supabase (не критично, если таблицы нет)
    if (user && supabase) {
      try {
        await supabase.from(table).upsert(toRow(p));
      } catch { /* ignore */ }
    }

    return p;
  }, [projects, user?.id]);

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    const idx = projects.findIndex(p => p.id === id);
    if (idx < 0) return;

    const updated: Project = {
      ...projects[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const next = [...projects];
    next[idx] = updated;
    await persistLocal(next);

    if (user && supabase) {
      try {
        await supabase.from(table).upsert(toRow(updated));
      } catch { /* ignore */ }
    }
  }, [projects, user?.id]);

  const deleteProject = useCallback(async (id: string) => {
    const next = projects.filter(p => p.id !== id);
    await persistLocal(next);
    if (user && supabase) {
      try {
        await supabase.from(table).delete().eq("id", id).eq("owner_id", user.id);
      } catch { /* ignore */ }
    }
    // чистим локальную статистику
    await AsyncStorage.removeItem(LS_CLICKS_PREFIX + id);
    setDailyCache(prev => { const cp = { ...prev }; delete cp[id]; return cp; });
  }, [projects, user?.id]);

  const setLinksOrder = useCallback(async (id: string, links: LinkBtn[]) => {
    await updateProject(id, { links });
  }, [updateProject]);

  // ---------- статистика кликов ----------
  const loadDaily = useCallback(async (projectId: string): Promise<DailyCache> => {
    const raw = await AsyncStorage.getItem(LS_CLICKS_PREFIX + projectId);
    if (!raw) return {};
    try { return JSON.parse(raw) as DailyCache; } catch { return {}; }
  }, []);
  const saveDaily = useCallback(async (projectId: string, map: DailyCache) => {
    await AsyncStorage.setItem(LS_CLICKS_PREFIX + projectId, JSON.stringify(map));
  }, []);

  const registerClick = useCallback(async (projectId: string, linkId: string) => {
    // 1) увеличим счётчик у ссылки
    const p = projects.find(x => x.id === projectId);
    if (p) {
      const links = p.links.map(l => l.id === linkId ? { ...l, clicks: (l.clicks || 0) + 1 } : l);
      await updateProject(projectId, { links });
    }

    // 2) учитываем в ежедневной карте
    const key = todayKey();
    const map = { ...(dailyCache[projectId] || {}) };
    map[key] = (map[key] || 0) + 1;
    setDailyCache(prev => ({ ...prev, [projectId]: map }));
    await saveDaily(projectId, map);

    // 3) пробуем отправить событие в Supabase (если есть таблица)
    if (user && supabase) {
      try {
        await supabase.from("linkpro_clicks").insert({
          project_id: projectId,
          link_id: linkId,
          owner_id: user.id,
          at: new Date().toISOString(),
        });
      } catch { /* optional */ }
    }
  }, [projects, dailyCache, updateProject, user?.id]);

  const preloadDailyClicks = useCallback(async (projectId: string, _days: number) => {
    // грузим локально; (при желании можно расширить: агрегировать с Supabase)
    const map = await loadDaily(projectId);
    setDailyCache(prev => ({ ...prev, [projectId]: map }));
  }, [loadDaily]);

  const getDailyClicks = useCallback((projectId: string, days: number) => {
    const labels = daysBackLabels(days);
    const map = dailyCache[projectId] || {};
    const counts = labels.map((dLabel, i) => {
      // восстановим YYYY-MM-DD для соответствующего дня
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return map[todayKey(d)] || 0;
    });
    return { labels, counts };
  }, [dailyCache]);

  const getProject = useCallback((id: string) => projects.find(p => p.id === id), [projects]);

  const getPublicUrl = useCallback((p: Project) => {
    // Плейсхолдер: когда подключим веб, здесь будет реальный URL страницы.
    // Пока генерируем стабильный slug или используем id.
    const slug = p.publicSlug || p.id;
    return `https://linkpro.app/p/${slug}`;
  }, []);

  const value = useMemo<Ctx>(() => ({
    projects,
    getProject,
    refresh,
    createProject,
    updateProject,
    deleteProject,
    setLinksOrder,
    registerClick,
    getDailyClicks,
    preloadDailyClicks,
    getPublicUrl,
  }), [projects, getProject, refresh, createProject, updateProject, deleteProject, setLinksOrder, registerClick, getDailyClicks, preloadDailyClicks, getPublicUrl]);

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}
