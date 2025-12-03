/**
 * Agent API Client
 * Interfaces with the Go Agent service for Azure container orchestration
 */

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8080';
const AGENT_API_ENABLED = process.env.AGENT_API_ENABLED === 'true';
const AGENT_HEALTH_TIMEOUT_MS = 8_000; // Cloudflare TLS negotiation sometimes needs a few seconds
const AGENT_CREATE_TIMEOUT_MS = 300_000; // provisioning can take ~2 minutes
const AGENT_ACTION_TIMEOUT_MS = 90_000;

type AgentSecretPayload = {
  githubToken?: string;
  codeServerPassword?: string;
  sshPublicKey?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
};

export interface CreateEnvironmentRequest extends AgentSecretPayload {
  workspaceId: string;
  userId: string;
  name: string;
  cloudProvider: 'AZURE';
  cloudRegion: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  baseImage: string;
}

export interface StartEnvironmentRequest extends AgentSecretPayload {
  workspaceId: string;
  cloudRegion: string;
  userId: string;
  name: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  baseImage: string;
}

export interface StopEnvironmentRequest {
  workspaceId: string;
  cloudRegion: string;
}

export interface DeleteEnvironmentRequest {
  workspaceId: string;
  cloudRegion: string;
  force?: boolean;
}

type AgentAPIResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  code?: string;
};

export type AgentConnectionURLs = {
  sshUrl: string;
  vscodeWebUrl: string;
  vscodeDesktopUrl: string;
  supervisorUrl: string;
  codeServerPassword?: string;
};

export interface EnvironmentResponse {
  id: string;
  name: string;
  userId: string;
  status: string;
  cloudRegion: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  baseImage: string;
  cloudProvider?: string;
  azureResourceGroup: string;
  azureContainerGroup: string;
  azureFileShare: string;
  azureFqdn: string;
  connectionUrls: AgentConnectionURLs;
  createdAt: string;
  updatedAt: string;
}

type EnvironmentEnvelope = {
  environment: EnvironmentResponse;
  message?: string;
};

async function agentRequest<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const response = await fetch(`${AGENT_API_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await response.text();
  let parsed: AgentAPIResponse<T> | null = null;

  if (text) {
    try {
      parsed = JSON.parse(text) as AgentAPIResponse<T>;
    } catch (error) {
      console.error('Agent API JSON parse failed:', error);
    }
  }

  if (!response.ok || !parsed?.success) {
    const details = parsed?.message || parsed?.error || text || response.statusText;
    throw new Error(`Agent API error: ${details}`);
  }

  return (parsed.data ?? ({} as T)) as T;
}

/**
 * Check if Agent API is enabled and available
 */
export async function isAgentAvailable(): Promise<boolean> {
  if (!AGENT_API_ENABLED) {
    return false;
  }

  try {
    const response = await fetch(`${AGENT_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(AGENT_HEALTH_TIMEOUT_MS),
    });
    
    // Accept 200 OK, 503 (degraded but operational)
    if (response.ok || response.status === 503) {
      return true;
    }
    
    console.warn(`Agent API health check returned status ${response.status}`);
    return false;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Agent API health check failed after ${AGENT_HEALTH_TIMEOUT_MS}ms: ${reason}`);
    return false;
  }
}

export function isAgentIntegrationEnabled(): boolean {
  return AGENT_API_ENABLED;
}

/**
 * Create a new environment via Agent API
 */
export async function createEnvironment(
  request: CreateEnvironmentRequest
): Promise<EnvironmentResponse> {
  const data = await agentRequest<EnvironmentEnvelope>(
    '/api/v1/environments',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
    AGENT_CREATE_TIMEOUT_MS,
  );

  if (!data?.environment) {
    throw new Error('Agent API returned an empty payload while creating workspace');
  }

  return data.environment;
}

/**
 * Start an existing environment
 */
export async function startEnvironment(
  request: StartEnvironmentRequest
): Promise<EnvironmentResponse> {
  const data = await agentRequest<EnvironmentEnvelope>(
    '/api/v1/environments/start',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
    AGENT_ACTION_TIMEOUT_MS,
  );

  if (!data?.environment) {
    throw new Error('Agent API returned an empty payload while starting workspace');
  }

  return data.environment;
}

/**
 * Stop a running environment
 */
export async function stopEnvironment(
  request: StopEnvironmentRequest
): Promise<void> {
  await agentRequest(
    '/api/v1/environments/stop',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
    AGENT_ACTION_TIMEOUT_MS,
  );
}

/**
 * Delete an environment permanently
 */
export async function deleteEnvironment(
  request: DeleteEnvironmentRequest
): Promise<void> {
  await agentRequest(
    '/api/v1/environments',
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, force: request.force ?? false }),
    },
    AGENT_ACTION_TIMEOUT_MS,
  );
}
