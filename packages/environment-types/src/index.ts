/**
 * @repo/environment-types
 * 
 * Shared types, schemas, and constants for Dev8.dev environment management
 */

// Export all types
export type {
  CloudProvider,
  EnvironmentStatus,
  BaseImage,
  HardwareConfig,
  Environment,
  Template,
  ResourceUsage,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
  EnvironmentActionResponse,
} from './types';

// Export all schemas and validation helpers
export {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  environmentIdSchema,
} from './schemas';

export type {
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
} from './schemas';

// Export all constants
export {
  HARDWARE_PRESETS,
  BASE_IMAGES,
  BASE_IMAGE_LABELS,
  BASE_IMAGE_DESCRIPTIONS,
  STATUS_LABELS,
  STATUS_COLORS,
  DEFAULT_CLOUD_CONFIG,
  AZURE_REGIONS,
  POLLING_INTERVALS,
  TIMEOUTS,
  VSCODE_PORT,
  RESOURCE_LIMITS,
  MAX_ENVIRONMENTS_PER_USER,
} from './constants';
