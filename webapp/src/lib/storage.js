import { isTaskExecutionType } from './task-types.js';
import { TIMER_STATES, normalizeTaskTimer, pauseTaskTimer, stopTaskTimer } from './task-timer.js';

const STORAGE_KEY = 'julo_web_workspace_v1';
const WORKSPACE_VERSION = 6;
const VALID_STATUSES = new Set(['todo', 'doing', 'done']);
const VALID_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);
const VALID_WORKSPACE_ROLES = new Set(['owner', 'admin', 'member', 'viewer', 'guest']);
const VALID_PROJECT_ROLES = new Set(['manager', 'editor', 'viewer']);
const LOCAL_OWNER_ID = 'member_local_owner';

export const MAX_BACKUP_TEXT_CHARS = 4 * 1024 * 1024;
const BACKUP_LIMITS = Object.freeze({
  projects: 1000,
  tasks: 10000,
  members: 1000,
  commentsPerTask: 500,
  tagsPerTask: 100,
  projectName: 500,
  taskTitle: 1000,
  taskDescription: 20000,
  commentText: 20000,
  memberName: 500,
  memberEmail: 500,
  tag: 200,
});

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

const normalizeComment = (comment, index) => ({
  id: asText(comment?.id, `comment_${index + 1}`),
  authorId: asText(comment?.authorId),
  authorName: asText(comment?.authorName, 'Օգտատեր').trim() || 'Օգտատեր',
  text: asText(comment?.text).trim(),
  createdAt: asText(comment?.createdAt, now()),
});

const normalizeTask = (task, index, projectIds) => {
  const projectId = asText(task?.projectId);
  const status = VALID_STATUSES.has(task?.status) ? task.status : 'todo';
  let timer = normalizeTaskTimer(task?.timer);
  if (status === 'done' && timer.state !== TIMER_STATES.STOPPED) {
    timer = stopTaskTimer(timer, Date.now(), 'completed');
  }
  return {
    id: asText(task?.id, `task_${index + 1}`),
    title: asText(task?.title).trim(),
    description: asText(task?.description),
    status,
    projectId: projectIds.has(projectId) ? projectId : '',
    priority: VALID_PRIORITIES.has(task?.priority) ? task.priority : 'normal',
    executionType: isTaskExecutionType(task?.executionType) ? task.executionType : '',
    dueDate: asText(task?.dueDate),
    tags: Array.isArray(task?.tags) ? task.tags.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean) : [],
    comments: Array.isArray(task?.comments)
      ? task.comments.map(normalizeComment).filter((comment) => comment.text)
      : [],
    timer,
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
  let runningTimerSeen = false;
  const tasks = (Array.isArray(source.tasks)
    ? source.tasks.map((task, index) => normalizeTask(task, index, projectIds)).filter((task) => task.title)
    : [])
    .map((task) => {
      if (task.timer.state !== TIMER_STATES.RUNNING) return task;
      if (!runningTimerSeen) {
        runningTimerSeen = true;
        return task;
      }
      return { ...task, timer: pauseTaskTimer(task.timer) };
    });
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
      theme,
      language: asText(source.settings?.language, 'hy') || 'hy',
    },
  };
};

const assertMaxText = (value, max, label) => {
  if (typeof value === 'string' && value.length > max) {
    throw new Error(`${label} դաշտը գերազանցում է թույլատրելի չափը։`);
  }
};

const assertWorkspaceBounds = (source) => {
  const projects = Array.isArray(source.projects) ? source.projects : [];
  const tasks = Array.isArray(source.tasks) ? source.tasks : [];
  const members = Array.isArray(source.members) ? source.members : [];

  if (projects.length > BACKUP_LIMITS.projects) throw new Error('Պահուստային պատճենում նախագծերի քանակը չափազանց մեծ է։');
  if (tasks.length > BACKUP_LIMITS.tasks) throw new Error('Պահուստային պատճենում առաջադրանքների քանակը չափազանց մեծ է։');
  if (members.length > BACKUP_LIMITS.members) throw new Error('Պահուստային պատճենում անդամների քանակը չափազանց մեծ է։');

  projects.forEach((project) => {
    assertMaxText(project?.name, BACKUP_LIMITS.projectName, 'Նախագծի անուն');
  });

  tasks.forEach((task) => {
    assertMaxText(task?.title, BACKUP_LIMITS.taskTitle, 'Առաջադրանքի վերնագիր');
    assertMaxText(task?.description, BACKUP_LIMITS.taskDescription, 'Առաջադրանքի նկարագրություն');

    const tags = Array.isArray(task?.tags) ? task.tags : [];
    const comments = Array.isArray(task?.comments) ? task.comments : [];
    if (tags.length > BACKUP_LIMITS.tagsPerTask) throw new Error('Առաջադրանքի պիտակների քանակը չափազանց մեծ է։');
    if (comments.length > BACKUP_LIMITS.commentsPerTask) throw new Error('Առաջադրանքի մեկնաբանությունների քանակը չափազանց մեծ է։');
    tags.forEach((tag) => assertMaxText(tag, BACKUP_LIMITS.tag, 'Պիտակ'));
    comments.forEach((comment) => assertMaxText(comment?.text, BACKUP_LIMITS.commentText, 'Մեկնաբանություն'));
  });

  members.forEach((member) => {
    assertMaxText(member?.name, BACKUP_LIMITS.memberName, 'Անդամի անուն');
    assertMaxText(member?.email, BACKUP_LIMITS.memberEmail, 'Էլ․ փոստ');
  });
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
  if (typeof text !== 'string' || text.length > MAX_BACKUP_TEXT_CHARS) {
    throw new Error('Պահուստային պատճենի ֆայլը չափազանց մեծ է։');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Ֆայլը վավեր JSON չէ։');
  }

  if (parsed?.format === 'julo-workspace' && parsed.formatVersion !== 1) {
    throw new Error('Պահուստային պատճենի տարբերակը դեռ չի աջակցվում։');
  }

  const source = parsed?.format === 'julo-workspace' ? parsed.workspace : parsed;
  if (!source || typeof source !== 'object' || !Array.isArray(source.projects) || !Array.isArray(source.tasks)) {
    throw new Error('Ֆայլը Julo աշխատանքային տարածքի պահուստային պատճեն չէ։');
  }

  assertWorkspaceBounds(source);
  return normalizeWorkspace(source);
};

let provider = localStorageProvider;
export const setStorageProvider = (nextProvider) => { provider = nextProvider; };
export const loadWorkspace = () => provider.load();
export const saveWorkspace = (state) => provider.save(state);
