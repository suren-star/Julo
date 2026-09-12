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
    description: 'Կարող է դիտել աշխատանքը և արտահանել իր հասանելի տվյալները, բայց չի խմբագրում։',
  },
  guest: {
    label: 'Հյուր',
    description: 'Տեսնում է միայն իրեն հասանելի դարձված նախագծերը։ Նախագծային հասանելիությունը կկառավարվի առանձին։',
  },
};

const ROLE_PERMISSIONS = {
  owner: ['*'],
  admin: [
    'members.manage',
    'projects.create', 'projects.update', 'projects.delete',
    'tasks.create', 'tasks.update', 'tasks.delete',
    'workspace.settings', 'workspace.import', 'workspace.export',
  ],
  member: [
    'projects.create', 'projects.update',
    'tasks.create', 'tasks.update', 'tasks.delete',
    'workspace.export',
  ],
  viewer: ['workspace.export'],
  guest: [],
};

export const isWorkspaceRole = (role) => Boolean(WORKSPACE_ROLES[role]);

export const can = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
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
