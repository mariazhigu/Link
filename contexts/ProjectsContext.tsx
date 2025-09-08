import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BlockBase = { id: string; type: 'text' | 'button' | 'image' | 'spacer' };
export type TextBlock = BlockBase & { type: 'text'; text?: string; fontSize?: number };
export type ButtonBlock = BlockBase & { type: 'button'; title?: string; url?: string; iconName?: string; radius?: number };
export type ImageBlock = BlockBase & { type: 'image'; uri?: string; borderRadius?: number };
export type SpacerBlock = BlockBase & { type: 'spacer'; height?: number };
export type Block = TextBlock | ButtonBlock | ImageBlock | SpacerBlock;

export type Metrics = { clicks?: Record<string, number> };

export type Project = {
  id: string;
  name: string;
  blocks: Block[];
  themeKey?: string;
  metrics?: Metrics;
  updatedAt: number;
};

type Ctx = {
  projects: Project[];
  currentProjectId: string | null;
  currentProject: Project | null;
  setCurrentProjectId: (id: string | null) => void;

  addNewProject: (name?: string) => string;
  createProject: (name?: string) => string;

  removeProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  updateProject: (patch: Partial<Project>) => void;

  addBlock: (type: Block['type']) => void;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, delta: number) => void;
  reorderBlocks: (orderIds: string[]) => void; // NEW
  updateBlock: (id: string, patch: Partial<Block>) => void;

  duplicateBlock: (id: string) => void;
  incrementClick: (blockId: string) => void;   // NEW
};

const CtxRef = createContext<Ctx | undefined>(undefined);
export const useProjects = () => {
  const v = useContext(CtxRef);
  if (!v) throw new Error('useProjects must be used within ProjectsProvider');
  return v;
};

const STORAGE_KEY = 'linkpro-projects-v3';
const STORAGE_CURR = 'linkpro-current-project-id';

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        // миграция с v2
        const [raw2, raw3, rawCurr] = await Promise.all([
          AsyncStorage.getItem('linkpro-projects-v2'),
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORAGE_CURR),
        ]);
        let list: Project[] = raw3 ? JSON.parse(raw3) : raw2 ? JSON.parse(raw2) : [];
        list = (Array.isArray(list) ? list : []).map(p => ({
          ...p,
          metrics: p.metrics ?? { clicks: {} },
        }));
        setProjects(list);
        setCurrentProjectId(rawCurr ?? null);
      } catch {
        setProjects([]);
        setCurrentProjectId(null);
      } finally {
        loadedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(projects)).catch(() => {});
  }, [projects]);

  useEffect(() => {
    if (!loadedRef.current) return;
    if (currentProjectId) AsyncStorage.setItem(STORAGE_CURR, currentProjectId).catch(() => {});
    else AsyncStorage.removeItem(STORAGE_CURR).catch(() => {});
  }, [currentProjectId]);

  const currentProject = useMemo(
    () => projects.find(p => p.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  // Projects
  const addNewProject = useCallback((name = 'Новый проект') => {
    const id = uid('prj');
    const next: Project = { id, name, blocks: [], themeKey: 'latte', metrics: { clicks: {} }, updatedAt: Date.now() };
    setProjects(prev => [next, ...prev]);
    setCurrentProjectId(id);
    return id;
  }, []);
  const createProject = addNewProject;

  const removeProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setCurrentProjectId(prev => (prev === id ? null : prev));
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p)));
  }, []);

  const updateProject = useCallback((patch: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => (p.id === currentProjectId ? { ...p, ...patch, updatedAt: Date.now() } : p))
    );
  }, [currentProjectId]);

  // Blocks
  const addBlock = useCallback((type: Block['type']) => {
    if (!currentProjectId) return;
    const newBlock: Block = (() => {
      switch (type) {
        case 'text': return { id: uid('blk'), type: 'text', text: '', fontSize: 16 };
        case 'button': return { id: uid('blk'), type: 'button', title: 'Кнопка', url: '', iconName: 'link', radius: 12 };
        case 'image': return { id: uid('blk'), type: 'image', uri: '', borderRadius: 12 };
        case 'spacer': return { id: uid('blk'), type: 'spacer', height: 16 };
      }
    })();
    setProjects(prev =>
      prev.map(p => p.id === currentProjectId ? { ...p, blocks: [...p.blocks, newBlock], updatedAt: Date.now() } : p)
    );
  }, [currentProjectId]);

  const removeBlock = useCallback((id: string) => {
    if (!currentProjectId) return;
    setProjects(prev =>
      prev.map(p => p.id === currentProjectId ? { ...p, blocks: p.blocks.filter(b => b.id !== id), updatedAt: Date.now() } : p)
    );
  }, [currentProjectId]);

  const moveBlock = useCallback((id: string, delta: number) => {
    if (!currentProjectId) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== currentProjectId) return p;
        const arr = [...p.blocks];
        const idx = arr.findIndex(b => b.id === id);
        if (idx < 0) return p;
        const to = Math.max(0, Math.min(arr.length - 1, idx + delta));
        if (to === idx) return p;
        const [item] = arr.splice(idx, 1);
        arr.splice(to, 0, item);
        return { ...p, blocks: arr, updatedAt: Date.now() };
      })
    );
  }, [currentProjectId]);

  const reorderBlocks = useCallback((orderIds: string[]) => {
    if (!currentProjectId) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== currentProjectId) return p;
        const map = new Map(p.blocks.map(b => [b.id, b]));
        const reordered: Block[] = orderIds.map(id => map.get(id)!).filter(Boolean);
        // добавим потерянные (на всякий случай)
        p.blocks.forEach(b => { if (!orderIds.includes(b.id)) reordered.push(b); });
        return { ...p, blocks: reordered, updatedAt: Date.now() };
      })
    );
  }, [currentProjectId]);

  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    if (!currentProjectId) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== currentProjectId) return p;
        const arr = p.blocks.map(b => (b.id === id ? { ...b, ...patch } as Block : b));
        return { ...p, blocks: arr, updatedAt: Date.now() };
      })
    );
  }, [currentProjectId]);

  const duplicateBlock = useCallback((id: string) => {
    if (!currentProjectId) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== currentProjectId) return p;
        const arr = [...p.blocks];
        const idx = arr.findIndex(b => b.id === id);
        if (idx < 0) return p;
        const copy = { ...arr[idx], id: uid('blk') } as Block;
        arr.splice(idx + 1, 0, copy);
        return { ...p, blocks: arr, updatedAt: Date.now() };
      })
    );
  }, [currentProjectId]);

  const incrementClick = useCallback((blockId: string) => {
    if (!currentProjectId) return;
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== currentProjectId) return p;
        const clicks = { ...(p.metrics?.clicks ?? {}) };
        clicks[blockId] = (clicks[blockId] ?? 0) + 1;
        return { ...p, metrics: { ...(p.metrics ?? {}), clicks }, updatedAt: Date.now() };
      })
    );
  }, [currentProjectId]);

  const value: Ctx = {
    projects, currentProjectId, currentProject, setCurrentProjectId,
    addNewProject, createProject, removeProject, renameProject, updateProject,
    addBlock, removeBlock, moveBlock, reorderBlocks, updateBlock,
    duplicateBlock, incrementClick,
  };

  return <CtxRef.Provider value={value}>{children}</CtxRef.Provider>;
}
