const STORAGE_KEY = 'julo_web_workspace_v1';
const WORKSPACE_VERSION = 2;
const VALID_STATUSES = new Set(['todo', 'doing', 'done']);
const VALID_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);

export const emptyWorkspace = () => ({
  version: WORKSPACE_VERSION,
  projects: [],
  tasks: [],
  settings: { theme: 'light', language: 'hy' },
});

const asText = (value, fallback = '') => typeof value === 'string' ? value : fallback;

const normalizeProject = (project, index) => ({
  id: asText(project?.id, `project_${index + 1}`),
  name: asText(project?.name, `Նախագիծ ${index + 1}`).trim() || `Նախագիծ ${index + 1}`,
  createdAt: asText(project?.createdAt, new Date().toISOString()),
});

const normalizeTask = (task, index, projectIds) => {
  const projectId = asText(task?.projectId);
  return {
    id: asText(task?.id, `task_${index + 1}`),
    title: asText(task?.title).trim(),
    description: asText(task?.description),
    status: VALID_STATUSES.has(task?.status) ? task.status : 'todo',
    projectId: projectIds.has(projectId) ? projectId : '',
    priority: VALID_PRIORITIES.has(task?.priority) ? task.priority : 'normal',
    dueDate: asText(task?.dueDate),
    tags: Array.isArray(task?.tags) ? task.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean) : [],
    createdAt: asText(task?.createdAt, new Date().toISOString()),
    updatedAt: asText(task?.updatedAt, asText(task?.createdAt, new Date().toISOString())),
  };
};

export const normalizeWorkspace = (source) => {
  if (!source || typeof source !== 'object') return emptyWorkspace();

  const projects = Array.isArray(source.projects)
    ? source.projects.map(normalizeProject)
    : [];
  const projectIds = new Set(projects.map((project) => project.id));
  const tasks = Array.isArray(source.tasks)
    ? source.tasks.map((task, index) => normalizeTask(task, index, projectIds)).filter((task) => task.title)
    : [];
  const theme = source.settings?.theme === 'dark' ? 'dark' : 'light';

  return {
    version: WORKSPACE_VERSION,
    projects,
    tasks,
    settings: {
      ...source.settings,
      theme,
      language: asText(source.settings?.language, 'hy') || 'hy',
    },
  };
};

export const localStorageProvider = {
  async load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeWorkspace(JSON.parse(raw)) : emptyWorkspace();
    } catch {
      return emptyWorkspace();
    }
  },
  async save(state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeWorkspace(state)));
  },
};

export const serializeWorkspace = (state) => JSON.stringify({
  format: 'julo-workspace',
  formatVersion: 1,
  exportedAt: new Date().toISOString(),
  workspace: normalizeWorkspace(state),
}, null, 2);

export const parseWorkspaceBackup = (text) => {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Ֆայլը վավեր JSON չէ։');
  }

  const source = parsed?.format === 'julo-workspace' ? parsed.workspace : parsed;
  if (!source || typeof source !== 'object' || !Array.isArray(source.projects) || !Array.isArray(source.tasks)) {
    throw new Error('Ֆայլը Julo աշխատանքային տարածքի պահուստային պատճեն չէ։');
  }
  return normalizeWorkspace(source);
};

let provider = localStorageProvider;
export const setStorageProvider = (nextProvider) => { provider = nextProvider; };
export const loadWorkspace = () => provider.load();
export const saveWorkspace = (state) => provider.save(state);
