import type {
  WorkspaceConfig,
  CreateWorkspaceResponse,
  StartWorkspaceRequest,
  StopWorkspaceRequest,
  DeleteWorkspaceRequest,
  HealthResponse,
  ApiResponse,
  Environment,
} from './types.js';

export class AgentClient {
  private static instance: AgentClient | null = null;
  private baseUrl: string;

  private constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  public static getInstance(baseUrl?: string): AgentClient {
    if (!AgentClient.instance) {
      if (!baseUrl) {
        throw new Error('Base URL is required for first initialization');
      }
      AgentClient.instance = new AgentClient(baseUrl);
    }
    return AgentClient.instance;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Request failed',
          error: data.error,
          code: data.code,
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        error: 'NETWORK_ERROR',
      };
    }
  }

  public async health(): Promise<ApiResponse<HealthResponse>> {
    return this.request<HealthResponse>('/health');
  }

  public async ready(): Promise<ApiResponse<HealthResponse>> {
    return this.request<HealthResponse>('/ready');
  }

  public async live(): Promise<ApiResponse<HealthResponse>> {
    return this.request<HealthResponse>('/live');
  }

  public async createWorkspace(
    config: WorkspaceConfig
  ): Promise<ApiResponse<CreateWorkspaceResponse>> {
    return this.request<CreateWorkspaceResponse>('/api/v1/environments', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  public async startWorkspace(
    request: StartWorkspaceRequest
  ): Promise<ApiResponse<{ environment: Environment; message: string }>> {
    return this.request<{ environment: Environment; message: string }>(
      '/api/v1/environments/start',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  public async stopWorkspace(
    request: StopWorkspaceRequest
  ): Promise<ApiResponse<{ workspaceId: string; message: string }>> {
    return this.request<{ workspaceId: string; message: string }>(
      '/api/v1/environments/stop',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  public async deleteWorkspace(
    request: DeleteWorkspaceRequest
  ): Promise<ApiResponse<{ workspaceId: string; message: string }>> {
    return this.request<{ workspaceId: string; message: string }>(
      '/api/v1/environments',
      {
        method: 'DELETE',
        body: JSON.stringify(request),
      }
    );
  }

  public async reportActivity(
    workspaceId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      `/api/v1/environments/${workspaceId}/activity`,
      {
        method: 'POST',
      }
    );
  }
}
