import {
  AZURE_REGIONS,
  BASE_IMAGE_CATEGORIES,
  BASE_IMAGE_DESCRIPTIONS,
  BASE_IMAGE_LABELS,
  BASE_IMAGES,
  DEFAULT_CLOUD_CONFIG,
  ESTIMATED_COSTS_PER_HOUR,
  HARDWARE_PRESETS,
} from '@repo/environment-types';

export const SUPPORTED_PROVIDER_ID = 'azure' as const;
export const SUPPORTED_CLOUD_PROVIDER = 'AZURE' as const;

export type SupportedProviderId = typeof SUPPORTED_PROVIDER_ID;
export type SupportedCloudProvider = typeof SUPPORTED_CLOUD_PROVIDER;

export type RegionId = keyof typeof AZURE_REGIONS;
export type HardwarePresetId = keyof typeof HARDWARE_PRESETS;
export type BaseImageId = keyof typeof BASE_IMAGE_LABELS;

export type RegionOption = {
  id: RegionId;
  label: string;
};

export type HardwarePresetOption = {
  id: HardwarePresetId;
  label: string;
  cpuCores: number;
  memoryGB: number;
  storageGB: number;
  instanceType: string;
  costPerHour: number;
};

export type BaseImageOption = {
  id: BaseImageId;
  label: string;
  description: string;
  category: string;
  imageRef: string;
};

export type ProviderOption = {
  id: SupportedProviderId;
  label: string;
  value: SupportedCloudProvider;
  description: string;
  status: 'online' | 'planned';
  regions: RegionOption[];
};

const regionOptions: RegionOption[] = Object.entries(AZURE_REGIONS).map(([id, label]) => ({
  id: id as RegionId,
  label,
}));

const supportedRegionIds = new Set<RegionId>(regionOptions.map((region) => region.id));

const hardwarePresetOptions: HardwarePresetOption[] = Object.entries(HARDWARE_PRESETS).map(([id, preset]) => ({
  id: id as HardwarePresetId,
  label: formatLabel(id),
  cpuCores: preset.cpuCores,
  memoryGB: preset.memoryGB,
  storageGB: preset.storageGB,
  instanceType: preset.instanceType,
  costPerHour: ESTIMATED_COSTS_PER_HOUR[id as keyof typeof ESTIMATED_COSTS_PER_HOUR] ?? ESTIMATED_COSTS_PER_HOUR.small,
}));

const baseImageOptions: BaseImageOption[] = Object.entries(BASE_IMAGE_LABELS).map(([id, label]) => {
  const key = id as BaseImageId;
  return {
    id: key,
    label,
    description: BASE_IMAGE_DESCRIPTIONS[key],
    category: BASE_IMAGE_CATEGORIES[key],
    imageRef: BASE_IMAGES[key],
  };
});

const providerOption: ProviderOption = {
  id: SUPPORTED_PROVIDER_ID,
  label: 'Azure Container Instances',
  value: SUPPORTED_CLOUD_PROVIDER,
  description: 'Optimized ACI workloads with persistent Azure File volumes',
  status: 'online',
  regions: regionOptions,
};

const defaultRegion = regionOptions.find((region) => region.id === DEFAULT_CLOUD_CONFIG.region) ?? regionOptions[0];
const defaultSize = hardwarePresetOptions.find((size) => size.id === 'medium') ?? hardwarePresetOptions[0];
const defaultImage = baseImageOptions.find((image) => image.id === 'node') ?? baseImageOptions[0];

const workspaceOptions = {
  providers: [providerOption],
  regions: regionOptions,
  sizes: hardwarePresetOptions,
  images: baseImageOptions,
  defaults: {
    providerId: providerOption.id,
    regionId: defaultRegion?.id ?? 'centralindia',
    sizeId: defaultSize?.id ?? 'medium',
    imageId: defaultImage?.id ?? 'node',
  },
} as const;

export type WorkspaceOptions = typeof workspaceOptions;

export function getWorkspaceOptions(): WorkspaceOptions {
  return workspaceOptions;
}

export function isSupportedRegion(regionId: string): regionId is RegionId {
  return supportedRegionIds.has(regionId as RegionId);
}

function formatLabel(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}
