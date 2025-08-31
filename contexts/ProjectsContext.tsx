import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** ===== Типы ===== */
export type Block = {
  id: string;
  type: 'text' | 'button' | 'image' | 'spacer';
  [k: string]: any;
};

export type Project = {
  id: string;
  name: string;
  blocks: Block[];
  theme?: { bg?: string[] };
};

type ProjectsContextValue = {
  projects: Project[];
  currentProject: Project | null;

  setCurrentProjectId: (id: string | null) => void;
  setProject: (projectId: string, patch: Partial<Project>) => void;

  updateBlock: (blockId: string, patch: Partial<Block>) => void;

  addProject: (p: Project | Partial<Project>) => void;
  addNewProject: (name?: string) => string;
  createProject: (name?: string) => string; // alias
  removeProject: (projectId: string) => void;
};

const STORAGE_KEY = 'linkpro-projects';
const STORAGE_CURR = 'linkpro-current-project-id';

/** ===== Утилиты ===== */
function useDebounced<T extends (...a: any[]) => void>(fn: T, delay = 500) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

function genId(prefix = 'p') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeBlock(input: any): Block {
  const type: Block['type'] = input?.type ?? 'text';
  const id = input?.id ?? genId('b');
  switch (type) {
    case 'text':
      return {
        id,
        type,
        text: input?.text ?? '',
        fontSize: Number.isFinite(input?.fontSize) ? input.fontSize : 16,
        align: input?.align ?? 'left',
      };
    case 'button':
      return {
        id,
        type,
        title: input?.title ?? 'Button',
        url: input?.url ?? '',
        radius: Number.isFinite(input?.radius) ? input.radius : 12,
        iconName: input?.iconName ?? undefined,
      };
    case 'image':
      return {
        id,
        type,
        uri: input?.uri ?? '',
        borderRadius: Number.isFinite(input?.borderRadius) ? input.borderRadius : 12,
      };
    case 'spacer':
      return {
        id,
        type,
        height: Number.isFinite(input?.height) ? input.height : 16,
      };
    default:
      return {
        id,
        type: 'text',
        text: String(input?.text ?? ''),
        fontSize: 16,
        align: 'left',
      };
  }
}

function normalizeProject(input: Project | Partial<Project>): Project {
  const id = input.id ?? genId('proj');
  const name = input.name ?? 'Новый проект';
  const blocksArr = Array.isArray(input.blocks) ? input.blocks : [];
  const blocks = blocksArr.map(normalizeBlock);
  const theme = input.theme && Array.isArray(input.theme.bg) && input.theme.bg.length > 0
    ? input.theme
    : { bg: ['#0f172a', '#111827'] };
  return { id, name, blocks, theme };
}

/** ===== Контекст ===== */
export const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined);

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  /** Загрузка + МИГРАЦИЯ старых данных */
  useEffect(() => {
    (async () => {
      try {
        const [rawProjects, rawCurr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORAGE_CURR),
        ]);
        const parsed = rawProjects ? JSON.parse(rawProjects) : [];
        const normalized: Project[] = (Array.isArray(parsed) ? parsed : []).map(normalizeProject);
        setProjects(normalized);

        const savedId: string | null = rawCurr ? JSON.parse(rawCurr) : null;
        // если сохранённый id отсутствует в списке — сбросить
        const validId = normalized.some(p => p.id === savedId) ? savedId : (normalized[0]?.id ?? null);
        setCurrentProjectId(validId);
      } catch (e) {
        console.warn('Projects load error', e);
      }
    })();
  }, []);

  /** Текущий проект */
  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  /** Мутаторы */
  const setProject = useCallback((projectId: string, patch: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? normalizeProject({ ...p, ...patch }) : p)));
  }, []);

  const updateBlock = useCallback(
    (blockId: string, patch: Partial<Block>) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== currentProjectId) return p;
          const blocks = (p.blocks ?? []).map((b) => (b.id === blockId ? normalizeBlock({ ...b, ...patch }) : b));
          return normalizeProject({ ...p, blocks });
        })
      );
    },
    [currentProjectId]
  );

  const addProject = useCallback((input: Project | Partial<Project>) => {
    const proj = normalizeProject(input);
    setProjects((prev) => [proj, ...prev]);
    setCurrentProjectId(proj.id);
  }, []);

  const addNewProject = useCallback((name?: string) => {
    const newProj = normalizeProject({
      name: name || 'Новый проект',
      blocks: [
        { type: 'text', text: 'Привет! 👋', fontSize: 20, align: 'center' },
        { type: 'spacer', height: 12 },
        { type: 'button', title: 'Открыть ссылку', url: 'https://example.com', radius: 12, iconName: 'link' },
      ] as any[],
    });
    setProjects((prev) => [newProj, ...prev]);
    setCurrentProjectId(newProj.id);
    return newProj.id;
  }, []);

  const createProject = useCallback((name?: string) => addNewProject(name), [addNewProject]);

  const removeProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setCurrentProjectId((curr) => (curr === projectId ? null : curr));
  }, []);

  /** Дебаунс-сохранение */
  const persist = useCallback(async (data: { projects: Project[]; currentProjectId: string | null }) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.projects)),
        AsyncStorage.setItem(STORAGE_CURR, JSON.stringify(data.currentProjectId)),
      ]);
    } catch (e) {
      console.warn('Projects persist error', e);
    }
  }, []);
  const persistDebounced = useDebounced(persist, 500);

  useEffect(() => {
    persistDebounced({ projects, currentProjectId });
  }, [projects, currentProjectId, persistDebounced]);

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      currentProject,
      setCurrentProjectId,
      setProject,
      updateBlock,
      addProject,
      addNewProject,
      createProject,
      removeProject,
    }),
    [projects, currentProject, updateBlock, setProject, addProject, addNewProject, createProject, removeProject]
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}
