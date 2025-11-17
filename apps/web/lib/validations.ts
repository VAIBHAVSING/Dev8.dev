import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  cloudProvider: z.enum(['AWS', 'GCP', 'AZURE', 'LOCAL']),
  cloudRegion: z.string().min(1, 'Region is required'),
  cpuCores: z.number().int().min(1).max(32),
  memoryGB: z.number().int().min(1).max(256),
  storageGB: z.number().int().min(1).max(1000),
  baseImage: z.string().min(1, 'Base image is required'),
  teamId: z.string().uuid().optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cpuCores: z.number().int().min(1).max(32).optional(),
  memoryGB: z.number().int().min(1).max(256).optional(),
  storageGB: z.number().int().min(1).max(1000).optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createSSHKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  publicKey: z.string().min(1, 'Public key is required'),
});

export const activityLogSchema = z.object({
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});
export const addSSHKeySchema = createSSHKeySchema;
export const deleteTeamSchema = z.object({});
