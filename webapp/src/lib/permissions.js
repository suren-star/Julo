export const WORKSPACE_ROLES = {
  owner: {
    label: 'Սեփականատեր',
    description: 'Լիարժեք վերահսկում՝ ներառյալ դերերը, կարգավորումները և ամբողջ աշխատանքային տարածքը։',
  },
  admin: {
    label: 'Ադմինիստրատոր',
    description: 'Կառավարում է անդամներին, նախագծերը և առաջադրանքները, բայց չի կարող փոխել սեփականատիրոջ կարգավիճակը։',
  },
  member: {
    label: 'Անդամ',
    description: 'Ստեղծում և խմբագրում է նախագծերն ու առաջադրանքները, առանց անդամների կառավարման իրավունքի։',
  },
  viewer: {
    label: 'Դիտորդ',
    description: 'Կարող է դիտել աշխատանքը, մեկնաբանել առաջադրանքները և արտահանել իր հասանելի տվյալները, բայց չի խմբագրում առաջադրանքի դաշտերը։',
  },
  guest: {
    label: 'Հյուր',
    description: 'Աշխատում է միայն իրեն հասանելի դարձված նախագծերում՝ ըստ նախագծային դերի։',
  },
};

export const PROJECT_ROLES = {
  manager: { label: 'Կառավարիչ', description: 'Կառավարում և խմբագրում է տվյալ նախագիծն ու նրա առաջադրանքները։' },
  editor: { label: 'Խմբագիր', description: 'Ստեղծում և խմբագրում է նախագծի առաջադրանքները։' },
  viewer: { label: 'Դիտորդ', description: 'Միայն դիտում է տվյալ նախագիծը։' },
};

const ROLE_PERMISSIONS = {
  owner: ['*'],
  admin: [
    'members.manage',
    'projects.create', 'projects.update', 'projects.delete',
    'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.comment', 'tasks.timer',
    'workspace.settings', 'workspace.import', 'workspace.export',
  ],
  member: [
    'projects.create', 'projects.update',
    'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.comment', 'tasks.timer',
    'workspace.export',
  ],
  viewer: ['tasks.comment', 'workspace.export'],
  guest: [],
};

const PROJECT_ROLE_PERMISSIONS = {
  manager: ['projects.update', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.timer'],
  editor: ['tasks.create', 'tasks.update', 'tasks.delete', 'tasks.timer'],
  viewer: [],
};

export const isWorkspaceRole = (role) => Boolean(WORKSPACE_ROLES[role]);
export const isProjectRole = (role) => Boolean(PROJECT_ROLES[role]);

export const can = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
};

export const canForMember = (member, permission, projectId = '') => {
  if (!member) return false;
  if (can(member.role, permission)) return true;
  if (member.role !== 'guest' || !projectId) return false;
  const projectRole = member.projectRoles?.[projectId];
  const permissions = PROJECT_ROLE_PERMISSIONS[projectRole] || [];
  return permissions.includes(permission);
};

export const canManageMemberRole = (actorRole, targetRole, nextRole) => {
  if (!can(actorRole, 'members.manage')) return false;
  if (targetRole === 'owner' || nextRole === 'owner') return actorRole === 'owner';
  return true;
};

export const visibleProjectsForMember = (workspace, member) => {
  if (!member || member.role !== 'guest') return workspace.projects || [];
  const allowed = new Set(Object.keys(member.projectRoles || {}));
  return (workspace.projects || []).filter((project) => allowed.has(project.id));
};

export const canReopenCompletedTask = (member) => member?.role === 'owner' || member?.role === 'admin';
