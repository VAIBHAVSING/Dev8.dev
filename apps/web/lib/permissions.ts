import { prisma } from './prisma';

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type Permission = 
  | 'team:read' | 'team:update' | 'team:delete'
  | 'member:invite' | 'member:remove' | 'member:update-role'
  | 'workspace:create' | 'workspace:read' | 'workspace:update' | 'workspace:delete';

const rolePermissions: Record<TeamRole, Permission[]> = {
  OWNER: ['team:read', 'team:update', 'team:delete', 'member:invite', 'member:remove', 'member:update-role', 'workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete'],
  ADMIN: ['team:read', 'team:update', 'member:invite', 'member:remove', 'workspace:create', 'workspace:read', 'workspace:update', 'workspace:delete'],
  MEMBER: ['team:read', 'workspace:read'],
};

export async function getUserTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  return member?.role as TeamRole | null;
}

export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId);
  return role !== null;
}

export async function isTeamOwner(userId: string, teamId: string): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId);
  return role === 'OWNER';
}

export async function isTeamAdmin(userId: string, teamId: string): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId);
  return role === 'OWNER' || role === 'ADMIN';
}

export async function checkTeamPermission(userId: string, teamId: string, permission: Permission): Promise<boolean> {
  const role = await getUserTeamRole(userId, teamId);
  if (!role) return false;
  const permissions = rolePermissions[role];
  return permissions.includes(permission);
}
