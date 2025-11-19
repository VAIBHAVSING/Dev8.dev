/**
 * @repo/environment-types
 *
 * Shared types, schemas, and constants for Dev8.dev environment management
 */

// Export all types
export type {
  CloudProvider,
  EnvironmentStatus,
  InstanceType,
  TemplateCategory,
  BaseImage,
  HardwareConfig,
  PortConfig,
  Environment,
  Template,
  ResourceUsage,
  CreateEnvironmentRequest,
  UpdateEnvironmentRequest,
  EnvironmentActionResponse,
  EnvironmentListResponse,
  TemplateListResponse,
  ResourceUsageSummary,
} from "./types";

// Export type guard functions
export {
  isValidEnvironmentStatus,
  isValidCloudProvider,
  isValidInstanceType,
  isValidBaseImage,
} from "./types";

// Export all schemas and validation helpers
export {
  createEnvironmentSchema,
  updateEnvironmentSchema,
  environmentIdSchema,
  userIdSchema,
  hardwareConfigSchema,
  portConfigSchema,
  environmentVariablesSchema,
  paginationSchema,
  templateFiltersSchema,
  environmentFiltersSchema,
  validateEnvironmentName,
  validatePortNumber,
  validateResourceLimits,
} from "./schemas";

export type {
  CreateEnvironmentInput,
  UpdateEnvironmentInput,
  HardwareConfigInput,
  PortConfigInput,
  PaginationInput,
  TemplateFiltersInput,
  EnvironmentFiltersInput,
} from "./schemas";

// Export all constants
export {
  HARDWARE_PRESETS,
  COMPUTE_OPTIMIZED_PRESETS,
  MEMORY_OPTIMIZED_PRESETS,
  BASE_IMAGES,
  BASE_IMAGE_LABELS,
  BASE_IMAGE_DESCRIPTIONS,
  BASE_IMAGE_CATEGORIES,
  STATUS_LABELS,
  STATUS_COLORS,
  INSTANCE_TYPE_LABELS,
  INSTANCE_TYPE_DESCRIPTIONS,
  DEFAULT_CLOUD_CONFIG,
  AZURE_REGIONS,
  AWS_REGIONS,
  GCP_REGIONS,
  POLLING_INTERVALS,
  TIMEOUTS,
  VSCODE_PORT,
  SSH_PORT,
  RESOURCE_LIMITS,
  MAX_ENVIRONMENTS_PER_USER,
  MAX_RUNNING_ENVIRONMENTS_PER_USER,
  ENVIRONMENT_NAME_MIN_LENGTH,
  ENVIRONMENT_NAME_MAX_LENGTH,
  ESTIMATED_COSTS_PER_HOUR,
  STORAGE_COST_PER_GB_MONTH,
  DEFAULT_PORTS,
  TEMPLATE_TAGS,
} from "./constants";
