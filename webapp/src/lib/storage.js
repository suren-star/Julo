const STORAGE_KEY = 'julo_web_workspace_v1';
const WORKSPACE_VERSION = 3;
const VALID_STATUSES = new Set(['todo', 'doing', 'done']);
const VALID_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);
const VALID_WORKSPACE_ROLES = new Set(['owner', 'admin', 'member', 'viewer', 'guest']);
const VALID_PROJECT_ROLES = new Set(['manager', 'editor', 'viewer']);
const LOCAL_OWNER_ID = 'member_local_owner';

const now = () => new Date().toISOString();

const defaultOwner = () => ({
  id: LOCAL_OWNER_ID,
  name: 'Դուք',
  email: '',
  role: 'owner',
  status: 'active',
  projectRoles: {},
  createdAt: now(),
});

export const emptyWorkspace = () => ({
  version: WORKSPACE_VERSION,
  projects: [],
  tasks: [],
  members: [defaultOwner()],
  currentUserId: LOCAL_OWNER_ID,
  settings: { theme: 'light', language: 'hy' },
});

const asText = (value, fallback = '') => typeof value === 'string' ? value : fallback;

const normalizeProject = (project, index) => ({
  id: asText(project?.id, `project_${index + 1}`),
  name: asText(project?.name, `Նախագիծ ${index + 1}`).trim() || `Նախագիծ ${index + 1}`,
  createdAt: asText(project?.createdAt, now()),
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
    createdAt: asText(task?.createdAt, now()),
    updatedAt: asText(task?.updatedAt, asText(task?.createdAt, now())),
  };
};

const normalizeProjectRoles = (roles, projectIds) => {
  if (!roles || typeof roles !== 'object' || Array.isArray(roles)) return {};
  return Object.fromEntries(Object.entries(roles).filter(([projectId, role]) => projectIds.has(projectId) && VALID_PROJECT_ROLES.has(role)));
};

const normalizeMember = (member, index, projectIds) => ({
  id: asText(member?.id, `member_${index + 1}`),
  name: asText(member?.name, `Անդամ ${index + 1}`).trim() || `Անդամ ${index + 1}`,
  email: asText(member?.email).trim(),
  role: VALID_WORKSPACE_ROLES.has(member?.role) ? member.role : 'member',
  status: member?.status === 'invited' ? 'invited' : 'active',
  projectRoles: normalizeProjectRoles(member?.projectRoles, projectIds),
  createdAt: asText(member?.createdAt, now()),
});

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

  let members = Array.isArray(source.members)
    ? source.members.map((member, index) => normalizeMember(member, index, projectIds))
    : [];

  if (!members.length) members = [defaultOwner()];
  if (!members.some((member) => member.role === 'owner')) {
    members = members.map((member, index) => index === 0 ? { ...member, role: 'owner' } : member);
  }

  const memberIds = new Set(members.map((member) => member.id));
  const owner = members.find((member) => member.role === 'owner') || members[0];
  const currentUserId = memberIds.has(source.currentUserId) ? source.currentUserId : owner.id;

  return {
    version: WORKSPACE_VERSION,
    projects,
    tasks,
    members,
    currentUserId,
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
  exportedAt: now(),
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
