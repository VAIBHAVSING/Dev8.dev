import { z } from 'zod';

/**
 * Schema for creating a new environment
 */
export const createEnvironmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Name can only contain letters, numbers, hyphens, and underscores'),
  baseImage: z.enum(['node', 'python', 'golang'], {
    errorMap: () => ({ message: 'Invalid base image. Must be node, python, or golang' }),
  }),
  cpuCores: z
    .number()
    .int('CPU cores must be an integer')
    .min(1, 'Minimum 1 CPU core')
    .max(8, 'Maximum 8 CPU cores'),
  memoryGB: z
    .number()
    .int('Memory must be an integer')
    .min(2, 'Minimum 2GB memory')
    .max(16, 'Maximum 16GB memory'),
  storageGB: z
    .number()
    .int('Storage must be an integer')
    .min(20, 'Minimum 20GB storage')
    .max(200, 'Maximum 200GB storage'),
});

/**
 * Schema for updating an environment
 */
export const updateEnvironmentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Name can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  cpuCores: z
    .number()
    .int('CPU cores must be an integer')
    .min(1, 'Minimum 1 CPU core')
    .max(8, 'Maximum 8 CPU cores')
    .optional(),
  memoryGB: z
    .number()
    .int('Memory must be an integer')
    .min(2, 'Minimum 2GB memory')
    .max(16, 'Maximum 16GB memory')
    .optional(),
});

/**
 * Schema for environment ID parameter
 */
export const environmentIdSchema = z.string().cuid('Invalid environment ID format');

/**
 * Type inference helpers
 */
export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
