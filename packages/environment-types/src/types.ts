/**
 * Cloud provider types (matching Prisma schema enum)
 */
export type CloudProvider = 'AZURE' | 'AWS' | 'GCP';

/**
 * Environment status types (matching Prisma schema enum)
 */
export type EnvironmentStatus =
  | 'CREATING'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'ERROR'
  | 'DELETING';

/**
 * Base image templates
 */
export type BaseImage = 'node' | 'python' | 'golang';

/**
 * Hardware configuration interface
 */
export interface HardwareConfig {
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
}

/**
 * Environment interface
 */
export interface Environment {
  id: string;
  userId: string;
  name: string;
  status: EnvironmentStatus;
  cloudProvider: CloudProvider;
  cloudRegion: string;
  baseImage: BaseImage;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  vsCodeUrl?: string;
  aciContainerGroupId?: string;
  aciPublicIp?: string;
  azureFileShareName?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

/**
 * Template interface
 */
export interface Template {
  id: string;
  name: string;
  displayName: string;
  description: string;
  baseImage: BaseImage;
  defaultCPU: number;
  defaultMemory: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resource usage interface
 */
export interface ResourceUsage {
  id: string;
  environmentId: string;
  timestamp: Date;
  cpuUsagePercent?: number;
  memoryUsageMB?: number;
}

/**
 * Create environment request
 */
export interface CreateEnvironmentRequest {
  name: string;
  baseImage: BaseImage;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
}

/**
 * Update environment request
 */
export interface UpdateEnvironmentRequest {
  name?: string;
  cpuCores?: number;
  memoryGB?: number;
}

/**
 * Environment action response
 */
export interface EnvironmentActionResponse {
  success: boolean;
  message: string;
  environment?: Environment;
  error?: string;
}
