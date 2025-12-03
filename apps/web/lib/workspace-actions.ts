import { Environment } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  deleteEnvironment,
  isAgentAvailable,
  isAgentIntegrationEnabled,
  startEnvironment,
  stopEnvironment,
  type EnvironmentResponse,
} from '@/lib/agent';

export type WorkspaceAction = 'START' | 'PAUSE' | 'STOP' | 'DELETE';

type ActionResult = {
  environment: Environment;
  message: string;
};

type AgentCallResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function performWorkspaceAction(options: {
  action: WorkspaceAction;
  environment: Environment;
  userId: string;
}): Promise<ActionResult> {
  const { action, environment, userId } = options;

  // Increase transaction timeout to 120 seconds for Agent API calls
  return prisma.$transaction(async (tx) => {
    const actionLog = await tx.environmentActionLog.create({
      data: {
        environmentId: environment.id,
        userId,
        action,
        status: 'PENDING',
      },
    });

    try {
      console.log(
        `[Workspace Action] ${action} started for workspace ${environment.id} by user ${userId}`,
      );

      const agentEnabled = isAgentIntegrationEnabled();
      const agentHealthy = agentEnabled ? await isAgentAvailable() : false;
      if (agentEnabled && !agentHealthy) {
        console.warn(`[Agent API] Health probe failed before ${action}; attempting anyway.`);
      }

      const tryAgentCall = async <T>(description: string, fn: () => Promise<T>): Promise<AgentCallResult<T>> => {
        if (!agentEnabled) {
          return { success: false, error: 'Agent integration disabled' };
        }
        try {
          const data = await fn();
          return { success: true, data };
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Agent API] ${description} failed: ${reason}`);
          return { success: false, error: reason };
        }
      };

      let updatedEnvironment: Environment;
      let message = '';

      switch (action) {
        case 'START': {
          await tx.environment.update({
            where: { id: environment.id },
            data: { status: 'STARTING' },
          });

          const agentResult = await tryAgentCall('start workspace', () =>
            startEnvironment({
              workspaceId: environment.id,
              cloudRegion: environment.cloudRegion,
              userId: environment.userId,
              name: environment.name,
              cpuCores: environment.cpuCores,
              memoryGB: environment.memoryGB,
              storageGB: environment.storageGB,
              baseImage: environment.baseImage,
            }),
          );

          let newVsCodeUrl: string | null = null;
          let newSshUrl: string | null = null;

          if (agentResult.success) {
            const envData = agentResult.data as EnvironmentResponse;
            newVsCodeUrl = envData.connectionUrls?.vscodeWebUrl || null;
            newSshUrl = envData.connectionUrls?.sshUrl || null;
            message = 'Workspace started via Agent API';
          } else {
            const errorDetails = agentResult.error;
            const reason = agentEnabled
              ? `Agent API unavailable${errorDetails ? `: ${errorDetails}` : ''}. `
              : 'Agent API disabled. ';
            message = `${reason}Workspace marked as RUNNING locally.`;
          }

          updatedEnvironment = await tx.environment.update({
            where: { id: environment.id },
            data: {
              status: 'RUNNING',
              vsCodeUrl: newVsCodeUrl || environment.vsCodeUrl,
              sshConnectionString: newSshUrl || environment.sshConnectionString,
              lastAccessedAt: new Date(),
              stoppedAt: null,
              deletedAt: null,
            },
          });
          break;
        }
        case 'PAUSE': {
          await tx.environment.update({
            where: { id: environment.id },
            data: { status: 'STOPPING' },
          });

          const pauseResult = await tryAgentCall('pause workspace', () =>
            stopEnvironment({
              workspaceId: environment.id,
              cloudRegion: environment.cloudRegion,
            }),
          );
          
          if (pauseResult.success) {
            message = 'Workspace paused via Agent API';
          } else {
            const errorDetails = pauseResult.error;
            message = agentEnabled
              ? `Agent API unavailable${errorDetails ? `: ${errorDetails}` : ''}. Workspace paused locally.`
              : 'Agent API disabled. Workspace paused locally.';
          }

          updatedEnvironment = await tx.environment.update({
            where: { id: environment.id },
            data: {
              status: 'PAUSED',
              stoppedAt: new Date(),
            },
          });
          break;
        }
        case 'STOP': {
          await tx.environment.update({
            where: { id: environment.id },
            data: { status: 'STOPPING' },
          });

          const stopResult = await tryAgentCall('stop workspace', () =>
            stopEnvironment({
              workspaceId: environment.id,
              cloudRegion: environment.cloudRegion,
            }),
          );
          
          if (stopResult.success) {
            message = 'Workspace stopped via Agent API';
          } else {
            const errorDetails = stopResult.error;
            message = agentEnabled
              ? `Agent API unavailable${errorDetails ? `: ${errorDetails}` : ''}. Workspace stopped locally.`
              : 'Agent API disabled. Workspace stopped locally.';
          }

          updatedEnvironment = await tx.environment.update({
            where: { id: environment.id },
            data: {
              status: 'STOPPED',
              stoppedAt: new Date(),
            },
          });
          break;
        }
        case 'DELETE': {
          await tx.environment.update({
            where: { id: environment.id },
            data: { status: 'DELETING' },
          });

          // For delete, always use force=true to allow deleting running workspaces
          const deleteResult = await tryAgentCall('delete workspace', () =>
            deleteEnvironment({
              workspaceId: environment.id,
              cloudRegion: environment.cloudRegion,
              force: true, // Always force delete from UI
            }),
          );
          
          if (deleteResult.success) {
            message = 'Workspace deleted via Agent API';
          } else {
            const errorDetails = deleteResult.error;
            message = agentEnabled
              ? `Agent API unavailable${errorDetails ? `: ${errorDetails}` : ''}. Workspace deleted locally.`
              : 'Agent API disabled. Workspace deleted locally.';
          }

          updatedEnvironment = await tx.environment.update({
            where: { id: environment.id },
            data: {
              status: 'STOPPED',
              deletedAt: new Date(),
            },
          });
          break;
        }
        default: {
          throw new Error(`Unsupported workspace action: ${action}`);
        }
      }

      await tx.environmentActionLog.update({
        where: { id: actionLog.id },
        data: {
          status: 'SUCCESS',
          message,
        },
      });
      console.log(
        `[Workspace Action] ${action} completed for workspace ${environment.id}: ${message}`,
      );

      return {
        environment: updatedEnvironment,
        message,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      await tx.environmentActionLog.update({
        where: { id: actionLog.id },
        data: {
          status: 'FAILED',
          message: reason,
        },
      });
      console.error(
        `[Workspace Action] ${action} failed for workspace ${environment.id}: ${reason}`,
      );
      throw error;
    }
  }, {
    maxWait: 120000, // 120 seconds max wait time
    timeout: 120000, // 120 seconds timeout for the transaction
  });
}
