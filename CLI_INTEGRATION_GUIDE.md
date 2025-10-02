# Multi-CLI Integration Guide

## Overview

This guide shows how to add support for Claude Code CLI, GitHub Copilot CLI, and Gemini CLI to Dev8.dev infrastructure.

## Architecture

```
User Request → API → Environment Manager → Container Instance
                                              ↓
                                     [VS Code | Claude | Copilot | Gemini]
```

## Implementation Steps

### 1. Update Azure Infrastructure (IaC)

#### Update ACI Module

**File:** `azure-infrastructure/modules/aci.bicep` (or in private repo)

```bicep
@description('CLI environment type')
@allowed([
  'vscode'
  'claude'
  'copilot'
  'gemini'
])
param cliType string = 'vscode'

@description('CLI-specific environment variables')
param cliEnvironmentVariables array = []

// Container configuration with dynamic naming
resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: containerGroupName
  location: location
  tags: union(tags, {
    CLIType: cliType
  })
  properties: {
    containers: [
      {
        name: '${cliType}-server'
        properties: {
          image: '${containerImage}:${cliType}'
          resources: {
            requests: {
              cpu: json(cpuCores)
              memoryInGB: json(memoryInGb)
            }
          }
          ports: [
            {
              port: cliType == 'vscode' ? 8080 : (cliType == 'claude' ? 8081 : 8082)
              protocol: 'TCP'
            }
          ]
          environmentVariables: union(environmentVariables, cliEnvironmentVariables)
          volumeMounts: [
            {
              name: 'workspace'
              mountPath: '/workspace'
              readOnly: false
            }
          ]
        }
      }
    ]
    // ... rest of configuration
  }
}
```

### 2. Create Docker Images

#### VS Code Server (Existing)

**File:** `docker/vscode-server/Dockerfile`

```dockerfile
FROM codercom/code-server:latest

# Install common tools
RUN apt-get update && apt-get install -y \
    git curl wget vim nano \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /workspace

EXPOSE 8080
CMD ["code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "/workspace"]
```

#### Claude Code CLI

**File:** `docker/claude-cli/Dockerfile`

```dockerfile
FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI
RUN npm install -g @anthropic-ai/claude-cli

# Install common development tools
RUN apt-get update && apt-get install -y \
    build-essential \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /workspace

# Environment variables (will be set at runtime)
ENV ANTHROPIC_API_KEY=""
ENV CLAUDE_MODEL="claude-3-opus-20240229"

# Start Claude CLI in interactive mode
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8081
ENTRYPOINT ["/entrypoint.sh"]
```

**File:** `docker/claude-cli/entrypoint.sh`

```bash
#!/bin/bash
set -e

# Verify API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY is not set"
    exit 1
fi

# Start Claude CLI server
echo "Starting Claude Code CLI..."
claude-cli serve --port 8081 --workspace /workspace

# Keep container running
tail -f /dev/null
```

#### GitHub Copilot CLI

**File:** `docker/copilot-cli/Dockerfile`

```dockerfile
FROM ubuntu:22.04

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub Copilot CLI
RUN npm install -g @githubnext/github-copilot-cli

# Install development tools
RUN apt-get update && apt-get install -y \
    build-essential \
    vim \
    nano \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /workspace

# GitHub authentication will be handled via environment variables
ENV GITHUB_TOKEN=""

# Start Copilot CLI in server mode
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8082
ENTRYPOINT ["/entrypoint.sh"]
```

**File:** `docker/copilot-cli/entrypoint.sh`

```bash
#!/bin/bash
set -e

# Verify GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN is not set"
    exit 1
fi

# Authenticate GitHub Copilot
echo "Authenticating GitHub Copilot..."
github-copilot-cli auth login --token "$GITHUB_TOKEN"

# Start Copilot CLI in server mode
echo "Starting GitHub Copilot CLI..."
github-copilot-cli serve --port 8082 --workspace /workspace

tail -f /dev/null
```

#### Gemini CLI

**File:** `docker/gemini-cli/Dockerfile`

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    vim \
    nano \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Google Cloud SDK and Gemini CLI
RUN pip install --no-cache-dir \
    google-generativeai \
    google-cloud-aiplatform \
    flask \
    requests

# Set up workspace
WORKDIR /workspace

# Environment variables
ENV GOOGLE_API_KEY=""
ENV GEMINI_MODEL="gemini-pro"

# Create a simple server wrapper for Gemini
COPY server.py /server.py
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8083
ENTRYPOINT ["/entrypoint.sh"]
```

**File:** `docker/gemini-cli/server.py`

```python
from flask import Flask, request, jsonify
import google.generativeai as genai
import os

app = Flask(__name__)

# Configure Gemini
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))
model = genai.GenerativeModel(os.environ.get('GEMINI_MODEL', 'gemini-pro'))

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model": os.environ.get('GEMINI_MODEL')})

@app.route('/complete', methods=['POST'])
def complete():
    data = request.json
    prompt = data.get('prompt', '')
    
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400
    
    try:
        response = model.generate_content(prompt)
        return jsonify({
            "completion": response.text,
            "model": os.environ.get('GEMINI_MODEL')
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    messages = data.get('messages', [])
    
    if not messages:
        return jsonify({"error": "No messages provided"}), 400
    
    try:
        chat = model.start_chat(history=messages[:-1])
        response = chat.send_message(messages[-1]['content'])
        return jsonify({
            "response": response.text,
            "model": os.environ.get('GEMINI_MODEL')
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083)
```

### 3. Update Backend API (Go)

**File:** `apps/agent/internal/azure/container.go`

```go
package azure

import (
	"context"
	"fmt"
)

// CLIType represents the type of CLI environment
type CLIType string

const (
	CLITypeVSCode   CLIType = "vscode"
	CLITypeClaude   CLIType = "claude"
	CLITypeCopilot  CLIType = "copilot"
	CLITypeGemini   CLIType = "gemini"
)

// CLIConfig holds CLI-specific configuration
type CLIConfig struct {
	Type        CLIType
	Image       string
	Port        int32
	APIKey      string // For Claude, Copilot, Gemini
	Model       string // For AI models
}

// GetCLIConfig returns configuration for the specified CLI type
func GetCLIConfig(cliType CLIType) (*CLIConfig, error) {
	configs := map[CLIType]*CLIConfig{
		CLITypeVSCode: {
			Type:  CLITypeVSCode,
			Image: "dev8-vscode-server:latest",
			Port:  8080,
		},
		CLITypeClaude: {
			Type:  CLITypeClaude,
			Image: "dev8-claude-cli:latest",
			Port:  8081,
			Model: "claude-3-opus-20240229",
		},
		CLITypeCopilot: {
			Type:  CLITypeCopilot,
			Image: "dev8-copilot-cli:latest",
			Port:  8082,
		},
		CLITypeGemini: {
			Type:  CLITypeGemini,
			Image: "dev8-gemini-cli:latest",
			Port:  8083,
			Model: "gemini-pro",
		},
	}

	config, ok := configs[cliType]
	if !ok {
		return nil, fmt.Errorf("unsupported CLI type: %s", cliType)
	}

	return config, nil
}

// CreateContainerInstance creates an ACI with the specified CLI type
func (c *Client) CreateContainerInstance(ctx context.Context, name string, cliType CLIType, apiKey string) error {
	config, err := GetCLIConfig(cliType)
	if err != nil {
		return err
	}

	// Set API key if needed
	config.APIKey = apiKey

	// Build environment variables based on CLI type
	envVars := c.buildEnvironmentVars(config)

	// Create container using Azure SDK
	// Implementation details...
	
	return nil
}

func (c *Client) buildEnvironmentVars(config *CLIConfig) map[string]string {
	envVars := make(map[string]string)

	switch config.Type {
	case CLITypeClaude:
		envVars["ANTHROPIC_API_KEY"] = config.APIKey
		envVars["CLAUDE_MODEL"] = config.Model
	case CLITypeCopilot:
		envVars["GITHUB_TOKEN"] = config.APIKey
	case CLITypeGemini:
		envVars["GOOGLE_API_KEY"] = config.APIKey
		envVars["GEMINI_MODEL"] = config.Model
	}

	return envVars
}
```

### 4. Update Frontend (Next.js)

**File:** `apps/web/components/EnvironmentSelector.tsx`

```typescript
'use client';

import { useState } from 'react';

export type CLIType = 'vscode' | 'claude' | 'copilot' | 'gemini';

interface EnvironmentSelectorProps {
  onSelect: (type: CLIType) => void;
}

export function EnvironmentSelector({ onSelect }: EnvironmentSelectorProps) {
  const [selected, setSelected] = useState<CLIType>('vscode');

  const environments = [
    {
      type: 'vscode' as CLIType,
      name: 'VS Code',
      description: 'Full-featured VS Code in the browser',
      icon: '💻',
      pricing: 'Included',
    },
    {
      type: 'claude' as CLIType,
      name: 'Claude Code CLI',
      description: 'AI-powered coding with Anthropic Claude',
      icon: '🤖',
      pricing: 'API costs apply',
    },
    {
      type: 'copilot' as CLIType,
      name: 'GitHub Copilot CLI',
      description: 'GitHub Copilot in your terminal',
      icon: '🐙',
      pricing: 'Requires GitHub subscription',
    },
    {
      type: 'gemini' as CLIType,
      name: 'Gemini CLI',
      description: 'Google Gemini AI coding assistant',
      icon: '✨',
      pricing: 'API costs apply',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {environments.map((env) => (
        <button
          key={env.type}
          onClick={() => {
            setSelected(env.type);
            onSelect(env.type);
          }}
          className={`p-6 border-2 rounded-lg text-left transition-all ${
            selected === env.type
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-4xl mb-2">{env.icon}</div>
          <h3 className="text-lg font-semibold mb-1">{env.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{env.description}</p>
          <span className="text-xs text-gray-500">{env.pricing}</span>
        </button>
      ))}
    </div>
  );
}
```

### 5. Update Environment Types

**File:** `packages/environment-types/src/index.ts`

```typescript
export type CLIType = 'vscode' | 'claude' | 'copilot' | 'gemini';

export interface EnvironmentConfig {
  id: string;
  name: string;
  cliType: CLIType;
  image: string;
  port: number;
  resources: {
    cpu: number;
    memory: number;
  };
  apiKey?: string; // For AI CLI types
  model?: string;  // For AI CLI types
}

export interface CreateEnvironmentRequest {
  userId: string;
  cliType: CLIType;
  name?: string;
  apiKey?: string; // Required for Claude, Copilot, Gemini
}

export interface EnvironmentStatus {
  id: string;
  cliType: CLIType;
  status: 'creating' | 'running' | 'stopped' | 'error';
  url?: string;
  error?: string;
}
```

### 6. API Endpoint Updates

**File:** `apps/web/app/api/environments/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CLIType } from '@repo/environment-types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cliType, apiKey } = body as {
    cliType: CLIType;
    apiKey?: string;
  };

  // Validate CLI type
  const validTypes: CLIType[] = ['vscode', 'claude', 'copilot', 'gemini'];
  if (!validTypes.includes(cliType)) {
    return NextResponse.json(
      { error: 'Invalid CLI type' },
      { status: 400 }
    );
  }

  // Validate API key for AI CLIs
  if (['claude', 'copilot', 'gemini'].includes(cliType) && !apiKey) {
    return NextResponse.json(
      { error: `API key required for ${cliType}` },
      { status: 400 }
    );
  }

  // Call backend to create environment
  try {
    const response = await fetch(`${process.env.BACKEND_URL}/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliType, apiKey }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create environment' },
      { status: 500 }
    );
  }
}
```

---

## Testing

### Local Testing

```bash
# Build all Docker images
docker build -t dev8-vscode-server docker/vscode-server
docker build -t dev8-claude-cli docker/claude-cli
docker build -t dev8-copilot-cli docker/copilot-cli
docker build -t dev8-gemini-cli docker/gemini-cli

# Test each image locally
docker run -p 8080:8080 dev8-vscode-server
docker run -p 8081:8081 -e ANTHROPIC_API_KEY=your-key dev8-claude-cli
docker run -p 8082:8082 -e GITHUB_TOKEN=your-token dev8-copilot-cli
docker run -p 8083:8083 -e GOOGLE_API_KEY=your-key dev8-gemini-cli
```

### Azure Testing

```bash
# Push images to Azure Container Registry
az acr login --name $REGISTRY_NAME
docker tag dev8-vscode-server $REGISTRY_NAME.azurecr.io/vscode-server:latest
docker tag dev8-claude-cli $REGISTRY_NAME.azurecr.io/claude-cli:latest
# ... push all images

# Test ACI deployment
az container create \
  --resource-group dev8-mvp-rg \
  --name test-claude \
  --image $REGISTRY_NAME.azurecr.io/claude-cli:latest \
  --environment-variables ANTHROPIC_API_KEY=$CLAUDE_KEY \
  --cpu 1 --memory 2 \
  --ports 8081
```

---

## Cost Considerations

### API Cost Estimates

**Claude (Anthropic):**
- Input: $15 per million tokens
- Output: $75 per million tokens
- Typical user: $5-20/month

**GitHub Copilot:**
- $10/user/month (if not already subscribed)
- Included for GitHub Copilot subscribers

**Google Gemini:**
- Free tier: First 60 queries/minute
- Paid: $0.001 per 1K characters
- Typical user: $2-10/month

### Pricing Strategy

Pass costs to users:
- Professional: Includes VS Code only
- Professional+ ($149/mo): Includes VS Code + AI CLI (API costs covered)
- Enterprise: Custom pricing with volume discounts

---

## Security Considerations

1. **API Key Management**
   - Store in Azure Key Vault
   - Rotate regularly
   - Encrypt in transit and at rest

2. **Rate Limiting**
   - Implement per-user limits
   - Monitor API usage
   - Alert on unusual patterns

3. **Access Control**
   - Verify user owns API keys
   - Sandbox CLI environments
   - Network isolation

---

## Next Steps

1. **Immediate:**
   - [ ] Decide which CLI to implement first
   - [ ] Set up Docker build pipeline
   - [ ] Test locally

2. **Week 1:**
   - [ ] Implement chosen CLI
   - [ ] Update infrastructure code
   - [ ] Deploy to staging

3. **Week 2:**
   - [ ] Add remaining CLIs
   - [ ] End-to-end testing
   - [ ] Documentation

4. **Week 3:**
   - [ ] Beta testing with users
   - [ ] Performance optimization
   - [ ] Production deployment

---

**Questions?** Open an issue or contact the team.
