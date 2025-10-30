export interface WorkspaceConfig {
  workspaceId: string;
  userId: string;
  name: string;
  cloudProvider?: 'AZURE';
  cloudRegion: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  baseImage: string;
  githubToken?: string;
  codeServerPassword?: string;
  sshPublicKey?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
}

export interface ConnectionUrls {
  vscode: string;
  ssh?: string;
}

export interface Environment {
  id: string;
  name: string;
  userId: string;
  status: 'RUNNING' | 'STOPPED' | 'CREATING' | 'DELETING';
  cloudRegion: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  baseImage: string;
  azureResourceGroup?: string;
  azureContainerGroup?: string;
  azureFileShare?: string;
  azureFqdn?: string;
  connectionUrls?: ConnectionUrls;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface CreateWorkspaceResponse {
  environment: Environment;
  message: string;
}

export interface StartWorkspaceRequest {
  workspaceId: string;
  cloudRegion: string;
  userId: string;
  name: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  baseImage: string;
  codeServerPassword?: string;
  githubToken?: string;
}

export interface StopWorkspaceRequest {
  workspaceId: string;
  cloudRegion: string;
}

export interface DeleteWorkspaceRequest {
  workspaceId: string;
  cloudRegion: string;
  force?: boolean;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: string;
}
