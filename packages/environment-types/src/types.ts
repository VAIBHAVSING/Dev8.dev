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
  | "PAUSED"
  | "ERROR"
  | "DELETING";

/**
 * IDE types (matching Prisma schema enum)
 */
export type IDEType = "VSCODE" | "CURSOR" | "JUPYTER";

/**
 * AI Agent types (matching Prisma schema enum)
 */
export type AgentType =
  | "NONE"
  | "COPILOT"
  | "CLAUDE"
  | "GEMINI"
  | "CODEX"
  | "COPILOT_PLUS";

/**
 * Secret types (matching Prisma schema enum)
 */
export type SecretType =
  | "GITHUB_TOKEN"
  | "ANTHROPIC_API_KEY"
  | "OPENAI_API_KEY"
  | "GEMINI_API_KEY"
  | "CUSTOM_ENV_VAR"
  | "SSH_PRIVATE_KEY";

/**
 * Backup trigger types (matching Prisma schema enum)
 */
export type BackupTrigger = "MANUAL" | "PRE_SHUTDOWN" | "SCHEDULED";

/**
 * Backup status types (matching Prisma schema enum)
 */
export type BackupStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

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

  // IDE and Agent Configuration
  ideType: IDEType;
  agentType: AgentType;
  dockerImage?: string;
  autoStopMinutes: number;
  autoStopEnabled: boolean;

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
  ideType?: IDEType;
  agentType?: AgentType;
  dockerImage?: string;
  autoStopMinutes?: number;
  autoStopEnabled?: boolean;
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
  ideType?: IDEType;
  agentType?: AgentType;
  dockerImage?: string;
  autoStopMinutes?: number;
  autoStopEnabled?: boolean;
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
    "PAUSED",
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

export function isValidIDEType(type: string): type is IDEType {
  return ["VSCODE", "CURSOR", "JUPYTER"].includes(type);
}

export function isValidAgentType(type: string): type is AgentType {
  return [
    "NONE",
    "COPILOT",
    "CLAUDE",
    "GEMINI",
    "CODEX",
    "COPILOT_PLUS",
  ].includes(type);
}

export function isValidSecretType(type: string): type is SecretType {
  return [
    "GITHUB_TOKEN",
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "CUSTOM_ENV_VAR",
    "SSH_PRIVATE_KEY",
  ].includes(type);
}

export function isValidBackupTrigger(
  trigger: string,
): trigger is BackupTrigger {
  return ["MANUAL", "PRE_SHUTDOWN", "SCHEDULED"].includes(trigger);
}

export function isValidBackupStatus(status: string): status is BackupStatus {
  return ["PENDING", "RUNNING", "COMPLETED", "FAILED"].includes(status);
}

/**
 * Activity report interface (matching Prisma schema)
 */
export interface ActivityReport {
  id: string;
  environmentId: string;
  lastIDEActivity?: Date;
  lastSSHActivity?: Date;
  activeIDEConnections: number;
  activeSSHConnections: number;
  cpuUsagePercent?: number;
  memoryUsageMB?: number;
  diskUsageMB?: number;
  networkRxMB?: number;
  networkTxMB?: number;
  supervisorVersion?: string;
  metadata?: Record<string, any>;
  reportedAt: Date;
}

/**
 * SSH key interface (matching Prisma schema)
 */
export interface SSHKey {
  id: string;
  userId: string;
  name: string;
  publicKey: string;
  fingerprint: string;
  keyType: string;
  isActive: boolean;
  lastUsedAt?: Date;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
}

/**
 * Secret interface (matching Prisma schema)
 */
export interface Secret {
  id: string;
  userId: string;
  name: string;
  secretType: SecretType;
  description?: string;
  vaultName?: string;
  secretName?: string;
  secretVersion?: string;
  lastRotatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

/**
 * Workspace interface (matching Prisma schema)
 */
export interface Workspace {
  id: string;
  environmentId: string;
  userId: string;
  storagePath: string;
  storageType: string;
  azureStorageAccount?: string;
  azureContainerName?: string;
  azureBlobPrefix?: string;
  backupEnabled: boolean;
  backupRetentionDays: number;
  lastBackupAt?: Date;
  totalSizeMB?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Backup interface (matching Prisma schema)
 */
export interface Backup {
  id: string;
  workspaceId: string;
  environmentId: string;
  trigger: BackupTrigger;
  status: BackupStatus;
  backupPath?: string;
  backupSizeMB?: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Create SSH key request
 */
export interface CreateSSHKeyRequest {
  name: string;
  publicKey: string;
}

/**
 * Create secret request
 */
export interface CreateSecretRequest {
  name: string;
  secretType: SecretType;
  description?: string;
  vaultName?: string;
  secretName?: string;
}

/**
 * Trigger backup request
 */
export interface TriggerBackupRequest {
  trigger?: BackupTrigger;
}
