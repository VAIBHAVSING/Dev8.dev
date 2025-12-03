import type { HardwareConfig, InstanceType } from "./types";

/**
 * Hardware preset configurations
 */
export const HARDWARE_PRESETS: Record<
  "micro" | "small" | "medium" | "large" | "xlarge",
  HardwareConfig
> = {
  micro: {
    cpuCores: 1,
    memoryGB: 2,
    storageGB: 20,
    instanceType: "balanced",
  },
  small: {
    cpuCores: 2,
    memoryGB: 4,
    storageGB: 30,
    instanceType: "balanced",
  },
  medium: {
    cpuCores: 4,
    memoryGB: 8,
    storageGB: 50,
    instanceType: "balanced",
  },
  large: {
    cpuCores: 8,
    memoryGB: 16,
    storageGB: 100,
    instanceType: "balanced",
  },
  xlarge: {
    cpuCores: 16,
    memoryGB: 32,
    storageGB: 200,
    instanceType: "balanced",
  },
} as const;

/**
 * Compute-optimized presets (higher CPU to memory ratio)
 */
export const COMPUTE_OPTIMIZED_PRESETS: Record<string, HardwareConfig> = {
  small: {
    cpuCores: 2,
    memoryGB: 4,
    storageGB: 30,
    instanceType: "compute-optimized",
  },
  medium: {
    cpuCores: 4,
    memoryGB: 8,
    storageGB: 50,
    instanceType: "compute-optimized",
  },
  large: {
    cpuCores: 8,
    memoryGB: 16,
    storageGB: 100,
    instanceType: "compute-optimized",
  },
} as const;

/**
 * Memory-optimized presets (higher memory to CPU ratio)
 */
export const MEMORY_OPTIMIZED_PRESETS: Record<string, HardwareConfig> = {
  small: {
    cpuCores: 2,
    memoryGB: 8,
    storageGB: 30,
    instanceType: "memory-optimized",
  },
  medium: {
    cpuCores: 4,
    memoryGB: 16,
    storageGB: 50,
    instanceType: "memory-optimized",
  },
  large: {
    cpuCores: 8,
    memoryGB: 32,
    storageGB: 100,
    instanceType: "memory-optimized",
  },
} as const;

/**
 * Base image mappings to Azure Container Registry
 */
export const BASE_IMAGES = {
  node: "dev8mvpregistry.azurecr.io/vscode-node:latest",
  python: "dev8mvpregistry.azurecr.io/vscode-python:latest",
  golang: "dev8mvpregistry.azurecr.io/vscode-go:latest",
  rust: "dev8mvpregistry.azurecr.io/vscode-rust:latest",
  java: "dev8mvpregistry.azurecr.io/vscode-java:latest",
  dotnet: "dev8mvpregistry.azurecr.io/vscode-dotnet:latest",
  php: "dev8mvpregistry.azurecr.io/vscode-php:latest",
  "fullstack-react": "dev8mvpregistry.azurecr.io/vscode-fullstack-react:latest",
  docker: "dev8mvpregistry.azurecr.io/vscode-docker:latest",
  "data-science": "dev8mvpregistry.azurecr.io/vscode-datascience:latest",
} as const;

/**
 * Base image display names
 */
export const BASE_IMAGE_LABELS = {
  node: "Node.js",
  python: "Python",
  golang: "Go",
  rust: "Rust",
  java: "Java",
  dotnet: ".NET",
  php: "PHP",
  "fullstack-react": "Full Stack (React)",
  docker: "Docker Development",
  "data-science": "Data Science",
} as const;

/**
 * Base image descriptions
 */
export const BASE_IMAGE_DESCRIPTIONS = {
  node: "JavaScript and TypeScript development with Node.js LTS, npm, pnpm, and common tools",
  python:
    "Python 3.11 development environment with pip, poetry, and data science libraries",
  golang:
    "Go 1.21+ development environment with standard toolchain and popular tools",
  rust: "Rust development with cargo, rustup, and essential tools",
  java: "Java development with JDK 17, Maven, and Gradle",
  dotnet: ".NET 8 development with C#, F#, and ASP.NET Core",
  php: "PHP 8.2 development with Composer and common frameworks",
  "fullstack-react": "React + Node.js full stack development environment",
  docker: "Docker and Kubernetes development with compose and kubectl",
  "data-science":
    "Python data science stack with Jupyter, pandas, numpy, and ML libraries",
} as const;

/**
 * Base image categories
 */
export const BASE_IMAGE_CATEGORIES = {
  node: "language",
  python: "language",
  golang: "language",
  rust: "language",
  java: "language",
  dotnet: "language",
  php: "language",
  "fullstack-react": "framework",
  docker: "devops",
  "data-science": "specialized",
} as const;

/**
 * Environment status display labels
 */
export const STATUS_LABELS = {
  CREATING: "Creating",
  STARTING: "Starting",
  RUNNING: "Running",
  STOPPING: "Stopping",
  STOPPED: "Stopped",
  ERROR: "Error",
  DELETING: "Deleting",
} as const;

/**
 * Environment status colors for UI
 */
export const STATUS_COLORS = {
  CREATING: "yellow",
  STARTING: "blue",
  RUNNING: "green",
  STOPPING: "orange",
  STOPPED: "gray",
  ERROR: "red",
  DELETING: "red",
} as const;

/**
 * Instance type labels
 */
export const INSTANCE_TYPE_LABELS: Record<InstanceType, string> = {
  balanced: "Balanced",
  "compute-optimized": "Compute Optimized",
  "memory-optimized": "Memory Optimized",
} as const;

/**
 * Instance type descriptions
 */
export const INSTANCE_TYPE_DESCRIPTIONS: Record<InstanceType, string> = {
  balanced: "Equal balance between CPU and memory for general workloads",
  "compute-optimized": "Higher CPU allocation for compute-intensive tasks",
  "memory-optimized":
    "Higher memory allocation for memory-intensive applications",
} as const;

/**
 * Default cloud configuration
 */
export const DEFAULT_CLOUD_CONFIG = {
  provider: "AZURE" as const,
  region: "centralindia",
};

/**
 * Azure regions
 */
export const AZURE_REGIONS = {
  centralindia: "Central India (Pune)",
} as const;

/**
 * AWS regions
 */
export const AWS_REGIONS = {
  "us-east-1": "US East (N. Virginia)",
  "us-west-2": "US West (Oregon)",
  "eu-west-1": "Europe (Ireland)",
  "ap-southeast-1": "Asia Pacific (Singapore)",
} as const;

/**
 * GCP regions
 */
export const GCP_REGIONS = {
  "us-central1": "US Central (Iowa)",
  "us-east1": "US East (South Carolina)",
  "europe-west1": "Europe West (Belgium)",
  "asia-east1": "Asia East (Taiwan)",
} as const;

/**
 * Polling intervals (in milliseconds)
 */
export const POLLING_INTERVALS = {
  STATUS_CHECK: 5000, // 5 seconds
  ENVIRONMENT_LIST: 30000, // 30 seconds
  RESOURCE_USAGE: 60000, // 1 minute
} as const;

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  ENVIRONMENT_CREATION: 300000, // 5 minutes
  ENVIRONMENT_START: 120000, // 2 minutes
  ENVIRONMENT_STOP: 60000, // 1 minute
  ENVIRONMENT_DELETE: 120000, // 2 minutes
  API_REQUEST: 30000, // 30 seconds
} as const;

/**
 * VS Code server default port
 */
export const VSCODE_PORT = 8080;

/**
 * SSH default port
 */
export const SSH_PORT = 22;

/**
 * Resource limits
 */
export const RESOURCE_LIMITS = {
  MIN_CPU_CORES: 1,
  MAX_CPU_CORES: 32,
  MIN_MEMORY_GB: 2,
  MAX_MEMORY_GB: 128,
  MIN_STORAGE_GB: 20,
  MAX_STORAGE_GB: 1000,
} as const;

/**
 * Maximum number of environments per user (MVP limit)
 */
export const MAX_ENVIRONMENTS_PER_USER = 10;

/**
 * Maximum number of concurrent running environments per user
 */
export const MAX_RUNNING_ENVIRONMENTS_PER_USER = 5;

/**
 * Environment name constraints
 */
export const ENVIRONMENT_NAME_MIN_LENGTH = 1;
export const ENVIRONMENT_NAME_MAX_LENGTH = 50;

/**
 * Cost estimation (in USD per hour) - approximate values
 */
export const ESTIMATED_COSTS_PER_HOUR = {
  micro: 0.05,
  small: 0.1,
  medium: 0.2,
  large: 0.4,
  xlarge: 0.8,
} as const;

/**
 * Storage cost per GB per month (in USD)
 */
export const STORAGE_COST_PER_GB_MONTH = 0.05;

/**
 * Default ports for different templates
 */
export const DEFAULT_PORTS = {
  node: [3000, 5173],
  python: [8000, 5000, 8888],
  golang: [8080],
  rust: [8080],
  java: [8080, 8081],
  dotnet: [5000, 5001],
  php: [8000, 3306],
  "fullstack-react": [3000, 5000],
  docker: [8080],
  "data-science": [8888, 6006],
} as const;

/**
 * Template tags for filtering and search
 */
export const TEMPLATE_TAGS = {
  POPULAR: "popular",
  BACKEND: "backend",
  FRONTEND: "frontend",
  FULLSTACK: "fullstack",
  DATA_SCIENCE: "data-science",
  DEVOPS: "devops",
  MICROSERVICES: "microservices",
  WEB: "web",
  ML: "ml",
  AI: "ai",
} as const;
