import type { HardwareConfig } from './types';

/**
 * Hardware preset configurations
 */
export const HARDWARE_PRESETS: Record<'small' | 'medium' | 'large', HardwareConfig> = {
  small: {
    cpuCores: 1,
    memoryGB: 2,
    storageGB: 20,
  },
  medium: {
    cpuCores: 2,
    memoryGB: 4,
    storageGB: 50,
  },
  large: {
    cpuCores: 4,
    memoryGB: 8,
    storageGB: 100,
  },
} as const;

/**
 * Base image mappings to Azure Container Registry
 * Note: Update these with your actual registry URL
 */
export const BASE_IMAGES = {
  node: 'dev8mvpregistry.azurecr.io/vscode-node:latest',
  python: 'dev8mvpregistry.azurecr.io/vscode-python:latest',
  golang: 'dev8mvpregistry.azurecr.io/vscode-go:latest',
} as const;

/**
 * Base image display names
 */
export const BASE_IMAGE_LABELS = {
  node: 'Node.js',
  python: 'Python',
  golang: 'Go',
} as const;

/**
 * Base image descriptions
 */
export const BASE_IMAGE_DESCRIPTIONS = {
  node: 'JavaScript and TypeScript development with Node.js LTS',
  python: 'Python 3.13.2 development environment',
  golang: 'Go 1.24 development environment',
} as const;

/**
 * Environment status display labels
 */
export const STATUS_LABELS = {
  CREATING: 'Creating',
  STARTING: 'Starting',
  RUNNING: 'Running',
  STOPPING: 'Stopping',
  STOPPED: 'Stopped',
  ERROR: 'Error',
  DELETING: 'Deleting',
} as const;

/**
 * Environment status colors for UI
 */
export const STATUS_COLORS = {
  CREATING: 'yellow',
  STARTING: 'blue',
  RUNNING: 'green',
  STOPPING: 'orange',
  STOPPED: 'gray',
  ERROR: 'red',
  DELETING: 'red',
} as const;

/**
 * Default cloud configuration
 */
export const DEFAULT_CLOUD_CONFIG = {
  provider: 'azure' as const,
  region: 'eastus',
};

/**
 * Azure regions (MVP limited to one region)
 */
export const AZURE_REGIONS = {
  eastus: 'East US',
} as const;

/**
 * Polling intervals (in milliseconds)
 */
export const POLLING_INTERVALS = {
  STATUS_CHECK: 5000, // 5 seconds
  ENVIRONMENT_LIST: 30000, // 30 seconds
} as const;

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  ENVIRONMENT_CREATION: 120000, // 2 minutes
  ENVIRONMENT_START: 60000, // 1 minute
  ENVIRONMENT_STOP: 30000, // 30 seconds
  ENVIRONMENT_DELETE: 60000, // 1 minute
} as const;

/**
 * VS Code server default port
 */
export const VSCODE_PORT = 8080;

/**
 * Resource limits
 */
export const RESOURCE_LIMITS = {
  MIN_CPU_CORES: 1,
  MAX_CPU_CORES: 8,
  MIN_MEMORY_GB: 2,
  MAX_MEMORY_GB: 16,
  MIN_STORAGE_GB: 20,
  MAX_STORAGE_GB: 200,
} as const;

/**
 * Maximum number of environments per user (MVP limit)
 */
export const MAX_ENVIRONMENTS_PER_USER = 5;
