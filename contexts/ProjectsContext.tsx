import React, {


const currentProject = useMemo(
() => projects.find((p) => p.id === currentProjectId) ?? null,
[projects, currentProjectId]
);


const setProject = useCallback((projectId: string, patch: Partial<Project>) => {
setProjects((prev) =>
prev.map((p) => (p.id === projectId ? { ...p, ...patch } : p))
);
}, []);


// Точечное обновление блока без избыточных ререндеров
const updateBlock = useCallback((blockId: string, patch: Partial<Block>) => {
setProjects((prev) =>
prev.map((p) => {
if (p.id !== currentProjectId) return p;
const blocks = (p.blocks ?? []).map((b) => (b.id === blockId ? { ...b, ...patch } : b));
return { ...p, blocks };
})
);
}, [currentProjectId]);


const addProject = useCallback((project: Project) => {
setProjects((prev) => [project, ...prev]);
setCurrentProjectId(project.id);
}, []);


const removeProject = useCallback((projectId: string) => {
setProjects((prev) => prev.filter((p) => p.id !== projectId));
setCurrentProjectId((curr) => (curr === projectId ? null : curr));
}, []);


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


const value: ProjectsContextValue = useMemo(() => ({
projects,
currentProject,
setCurrentProjectId,
setProject,
updateBlock,
addProject,
removeProject,
}), [projects, currentProject, updateBlock, setProject, addProject, removeProject]);


return (
<ProjectsContext.Provider value={value}>
{children}
</ProjectsContext.Provider>
);
}