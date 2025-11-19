import { z } from "zod";

/**
 * Valid base images enum
 */
const baseImageEnum = z.enum([
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
]);

/**
 * Valid cloud providers enum
 */
const cloudProviderEnum = z.enum(["AZURE", "AWS", "GCP"]);

/**
 * Valid instance types enum
 */
const instanceTypeEnum = z.enum([
  "balanced",
  "compute-optimized",
  "memory-optimized",
]);

/**
 * Environment name validation regex
 */
const environmentNameRegex = /^[a-zA-Z0-9-_\s]+$/;

/**
 * Port configuration schema
 */
export const portConfigSchema = z.object({
  port: z.number().int().min(1).max(65535, "Port must be between 1 and 65535"),
  protocol: z.enum(["http", "https", "tcp", "udp"]),
  description: z.string().optional(),
});

/**
 * Environment variables schema
 */
export const environmentVariablesSchema = z.record(
  z.string().min(1, "Variable name cannot be empty"),
  z.string(),
);

/**
 * Hardware configuration schema
 */
export const hardwareConfigSchema = z.object({
  cpuCores: z
    .number()
    .int("CPU cores must be an integer")
    .min(2, "Minimum 2 CPU cores")
    .max(32, "Maximum 32 CPU cores"),
  memoryGB: z
    .number()
    .int("Memory must be an integer")
    .min(4, "Minimum 4GB memory")
    .max(128, "Maximum 128GB memory"),
  storageGB: z
    .number()
    .int("Storage must be an integer")
    .min(20, "Minimum 20GB storage")
    .max(1000, "Maximum 1000GB storage"),
  instanceType: instanceTypeEnum.default("balanced"),
});

/**
 * Schema for creating a new environment
 */
export const createEnvironmentSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(50, "Name must be less than 50 characters")
      .regex(
        environmentNameRegex,
        "Name can only contain letters, numbers, spaces, hyphens, and underscores",
      ),
    baseImage: baseImageEnum,
    cloudProvider: cloudProviderEnum.default("AZURE"),
    cloudRegion: z
      .string()
      .min(1, "Cloud region is required")
      .default("eastus"),
    cpuCores: z
      .number()
      .int("CPU cores must be an integer")
      .min(2, "Minimum 2 CPU cores")
      .max(32, "Maximum 32 CPU cores")
      .default(2),
    memoryGB: z
      .number()
      .int("Memory must be an integer")
      .min(4, "Minimum 4GB memory")
      .max(128, "Maximum 128GB memory")
      .default(4),
    storageGB: z
      .number()
      .int("Storage must be an integer")
      .min(20, "Minimum 20GB storage")
      .max(1000, "Maximum 1000GB storage")
      .default(20),
    instanceType: instanceTypeEnum.default("balanced"),
    templateName: z.string().optional(),
    environmentVariables: environmentVariablesSchema.optional(),
  })
  .refine(
    (data) => {
      // Memory should be at least 2x CPU for balanced instances
      if (data.instanceType === "balanced") {
        return data.memoryGB >= data.cpuCores * 2;
      }
      // Memory-optimized should have higher memory ratio
      if (data.instanceType === "memory-optimized") {
        return data.memoryGB >= data.cpuCores * 4;
      }
      return true;
    },
    {
      message:
        "Memory and CPU configuration does not match selected instance type",
      path: ["memoryGB"],
    },
  );

/**
 * Schema for updating an environment
 */
export const updateEnvironmentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(
      environmentNameRegex,
      "Name can only contain letters, numbers, spaces, hyphens, and underscores",
    )
    .optional(),
  cpuCores: z
    .number()
    .int("CPU cores must be an integer")
    .min(2, "Minimum 2 CPU cores")
    .max(32, "Maximum 32 CPU cores")
    .optional(),
  memoryGB: z
    .number()
    .int("Memory must be an integer")
    .min(4, "Minimum 4GB memory")
    .max(128, "Maximum 128GB memory")
    .optional(),
  storageGB: z
    .number()
    .int("Storage must be an integer")
    .min(20, "Minimum 20GB storage")
    .max(1000, "Maximum 1000GB storage")
    .optional(),
  environmentVariables: environmentVariablesSchema.optional(),
});

/**
 * Schema for environment ID parameter
 */
export const environmentIdSchema = z
  .string()
  .cuid("Invalid environment ID format");

/**
 * Schema for user ID parameter
 */
export const userIdSchema = z.string().cuid("Invalid user ID format");

/**
 * Schema for pagination parameters
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * Schema for template filters
 */
export const templateFiltersSchema = z.object({
  category: z
    .enum(["language", "framework", "devops", "specialized"])
    .optional(),
  isPopular: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Schema for environment filters
 */
export const environmentFiltersSchema = z.object({
  status: z
    .enum([
      "CREATING",
      "STARTING",
      "RUNNING",
      "STOPPING",
      "STOPPED",
      "ERROR",
      "DELETING",
    ])
    .optional(),
  cloudProvider: cloudProviderEnum.optional(),
  search: z.string().optional(),
});

/**
 * Type inference helpers
 */
export type CreateEnvironmentInput = z.infer<typeof createEnvironmentSchema>;
export type UpdateEnvironmentInput = z.infer<typeof updateEnvironmentSchema>;
export type HardwareConfigInput = z.infer<typeof hardwareConfigSchema>;
export type PortConfigInput = z.infer<typeof portConfigSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type TemplateFiltersInput = z.infer<typeof templateFiltersSchema>;
export type EnvironmentFiltersInput = z.infer<typeof environmentFiltersSchema>;

/**
 * Validation helper functions
 */
export function validateEnvironmentName(name: string): boolean {
  return (
    environmentNameRegex.test(name) && name.length >= 1 && name.length <= 50
  );
}

export function validatePortNumber(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

type InstanceTypeInput = z.infer<typeof instanceTypeEnum>;

export function validateResourceLimits(
  cpuCores: number,
  memoryGB: number,
  instanceType: InstanceTypeInput = "balanced",
): boolean {
  if (cpuCores < 2 || cpuCores > 32 || memoryGB < 4 || memoryGB > 128) {
    return false;
  }

  const requiredRatio = instanceType === "memory-optimized" ? 4 : 2;
  return memoryGB >= cpuCores * requiredRatio;
}
