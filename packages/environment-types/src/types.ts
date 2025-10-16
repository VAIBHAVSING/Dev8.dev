/**
 * Cloud provider types (matching Prisma schema enum)
 */
export type CloudProvider = "AZURE" | "AWS" | "GCP";

/**
 * Environment status types (matching Prisma schema enum)
 */
export type EnvironmentStatus =
  | "CREATING"
  | "STARTING"
  | "RUNNING"
  | "STOPPING"
  | "STOPPED"
  | "ERROR"
  | "DELETING";

/**
 * Instance types for resource optimization
 */
export type InstanceType =
  | "balanced"
  | "compute-optimized"
  | "memory-optimized";

/**
 * Template categories
 */
export type TemplateCategory =
  | "language"
  | "framework"
  | "devops"
  | "specialized";

/**
 * Base image templates (extended set)
 */
export type BaseImage =
  | "node"
  | "python"
  | "golang"
  | "rust"
  | "java"
  | "dotnet"
  | "php"
  | "fullstack-react"
  | "docker"
  | "data-science";

/**
 * Hardware configuration interface
 */
export interface HardwareConfig {
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  instanceType: InstanceType;
}

/**
 * Port configuration interface
 */
export interface PortConfig {
  port: number;
  protocol: "http" | "https" | "tcp" | "udp";
  description?: string;
}

/**
 * Environment interface (matching enhanced Prisma schema)
 */
export interface Environment {
  id: string;
  userId: string;
  name: string;
  status: EnvironmentStatus;

  // Cloud Configuration
  cloudProvider: CloudProvider;
  cloudRegion: string;
  aciContainerGroupId?: string;
  aciPublicIp?: string;

  // Storage
  azureFileShareName?: string;
  vsCodeUrl?: string;
  sshConnectionString?: string;

  // Resources
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  instanceType: InstanceType;

  // Template and Configuration
  baseImage: string;
  templateName?: string;
  environmentVariables?: Record<string, string>;
  ports?: PortConfig[];

  // Cost tracking
  estimatedCostPerHour?: number;
  totalCost?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  stoppedAt?: Date;
  deletedAt?: Date;
}

/**
 * Template interface (matching enhanced Prisma schema)
 */
export interface Template {
  id: string;
  name: string;
  displayName: string;
  description: string;
  baseImage: string;
  defaultCPU: number;
  defaultMemory: number;
  defaultStorage: number;

  // Template configuration
  category: TemplateCategory;
  tags: string[];
  icon?: string;
  isPopular: boolean;
  isActive: boolean;

  // Additional config
  defaultPorts?: PortConfig[];
  defaultEnvVars?: Record<string, string>;
  extensions?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resource usage interface (matching enhanced Prisma schema)
 */
export interface ResourceUsage {
  id: string;
  environmentId: string;
  timestamp: Date;

  // Resource metrics
  cpuUsagePercent?: number;
  memoryUsageMB?: number;
  diskUsageMB?: number;
  networkInMB?: number;
  networkOutMB?: number;

  // Cost calculation
  costAmount?: number;
  billingPeriod?: string;
}

/**
 * Create environment request
 */
export interface CreateEnvironmentRequest {
  name: string;
  baseImage: BaseImage;
  cloudProvider?: CloudProvider;
  cloudRegion?: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  instanceType?: InstanceType;
  templateName?: string;
  environmentVariables?: Record<string, string>;
}

/**
 * Update environment request
 */
export interface UpdateEnvironmentRequest {
  name?: string;
  cpuCores?: number;
  memoryGB?: number;
  storageGB?: number;
  environmentVariables?: Record<string, string>;
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

/**
 * Environment list response
 */
export interface EnvironmentListResponse {
  environments: Environment[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * Template list response
 */
export interface TemplateListResponse {
  templates: Template[];
  total: number;
}

/**
 * Resource usage summary
 */
export interface ResourceUsageSummary {
  environmentId: string;
  totalCost: number;
  averageCPU: number;
  averageMemory: number;
  totalDiskUsage: number;
  totalNetworkIn: number;
  totalNetworkOut: number;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Type guards for runtime type checking
 */
export function isValidEnvironmentStatus(
  status: string,
): status is EnvironmentStatus {
  return [
    "CREATING",
    "STARTING",
    "RUNNING",
    "STOPPING",
    "STOPPED",
    "ERROR",
    "DELETING",
  ].includes(status);
}

export function isValidCloudProvider(
  provider: string,
): provider is CloudProvider {
  return ["AZURE", "AWS", "GCP"].includes(provider);
}

export function isValidInstanceType(type: string): type is InstanceType {
  return ["balanced", "compute-optimized", "memory-optimized"].includes(type);
}

export function isValidBaseImage(image: string): image is BaseImage {
  return [
    "node",
    "python",
    "golang",
    "rust",
    "java",
    "dotnet",
    "php",
    "fullstack-react",
    "docker",
    "data-science",
  ].includes(image);
}
