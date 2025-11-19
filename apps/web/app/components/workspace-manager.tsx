"use client";

import { useState } from "react";

interface Workspace {
  id: string;
  name: string;
  status: "RUNNING" | "STOPPED" | "CREATING" | "DELETING";
  cloudRegion: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  baseImage: string;
  connectionUrls?: {
    vscode?: string;
    ssh?: string;
  };
}

export function WorkspaceManager() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cloudRegion: "centralindia",
    cpuCores: 1,
    memoryGB: 2,
    storageGB: 10,
    baseImage: "dev8/ubuntu-vscode:latest",
  });

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate a unique workspace ID
      const workspaceId = `ws-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace");
      }

      setSuccess("Workspace created successfully! This may take 2-3 minutes.");
      
      // Add the new workspace to the list
      if (data.data?.environment) {
        setWorkspaces([...workspaces, data.data.environment]);
      }

      // Reset form
      setFormData({
        name: "",
        cloudRegion: "centralindia",
        cpuCores: 1,
        memoryGB: 2,
        storageGB: 10,
        baseImage: "dev8/ubuntu-vscode:latest",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartWorkspace = async (workspace: Workspace) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/workspaces/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          cloudRegion: workspace.cloudRegion,
          name: workspace.name,
          cpuCores: workspace.cpuCores,
          memoryGB: workspace.memoryGB,
          storageGB: workspace.storageGB,
          baseImage: workspace.baseImage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start workspace");
      }

      setSuccess("Workspace started successfully!");
      
      // Update workspace status
      setWorkspaces(
        workspaces.map((ws) =>
          ws.id === workspace.id ? { ...ws, status: "RUNNING" as const } : ws
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start workspace");
    }
  };

  const handleStopWorkspace = async (workspace: Workspace) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/workspaces/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          cloudRegion: workspace.cloudRegion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop workspace");
      }

      setSuccess("Workspace stopped successfully!");
      
      // Update workspace status
      setWorkspaces(
        workspaces.map((ws) =>
          ws.id === workspace.id ? { ...ws, status: "STOPPED" as const } : ws
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop workspace");
    }
  };

  const handleDeleteWorkspace = async (workspace: Workspace) => {
    if (!confirm(`Are you sure you want to delete workspace "${workspace.name}"?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/workspaces", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          cloudRegion: workspace.cloudRegion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete workspace");
      }

      setSuccess("Workspace deleted successfully!");
      
      // Remove workspace from list
      setWorkspaces(workspaces.filter((ws) => ws.id !== workspace.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete workspace");
    }
  };

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
          <p className="font-medium">Success</p>
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Create Workspace Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Create New Workspace
        </h3>
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Workspace Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="My Workspace"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cpuCores" className="block text-sm font-medium text-gray-700">
                CPU Cores
              </label>
              <input
                type="number"
                id="cpuCores"
                min="1"
                max="8"
                required
                value={formData.cpuCores}
                onChange={(e) =>
                  setFormData({ ...formData, cpuCores: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="memoryGB" className="block text-sm font-medium text-gray-700">
                Memory (GB)
              </label>
              <input
                type="number"
                id="memoryGB"
                min="1"
                max="32"
                required
                value={formData.memoryGB}
                onChange={(e) =>
                  setFormData({ ...formData, memoryGB: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isCreating ? "Creating Workspace..." : "Create Workspace"}
          </button>
        </form>
      </div>

      {/* Workspace List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Your Workspaces
        </h3>
        
        {workspaces.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No workspaces yet. Create one to get started!
          </p>
        ) : (
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-gray-900">
                      {workspace.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {workspace.cpuCores} CPU • {workspace.memoryGB}GB RAM • {workspace.storageGB}GB Storage
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          workspace.status === "RUNNING"
                            ? "bg-green-100 text-green-800"
                            : workspace.status === "STOPPED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {workspace.status}
                      </span>
                    </div>
                    {workspace.connectionUrls?.vscode && (
                      <div className="mt-2">
                        <a
                          href={workspace.connectionUrls.vscode}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          Open VS Code →
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {workspace.status === "STOPPED" && (
                      <button
                        onClick={() => handleStartWorkspace(workspace)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                      >
                        Start
                      </button>
                    )}
                    {workspace.status === "RUNNING" && (
                      <button
                        onClick={() => handleStopWorkspace(workspace)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md"
                      >
                        Stop
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteWorkspace(workspace)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
