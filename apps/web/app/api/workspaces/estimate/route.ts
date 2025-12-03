import { NextResponse } from "next/server";
import { getWorkspaceOptions, SUPPORTED_PROVIDER_ID } from "@/lib/workspace-options";
import type { HardwarePresetId } from "@/lib/workspace-options";

type Body = {
  sizeId?: string;
  size?: string; // backward compatibility
  hoursPerDay?: number;
};

const options = getWorkspaceOptions();
const DEFAULT_SIZE_ID = options.defaults.sizeId as HardwarePresetId;

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const requestedSize = (body.sizeId || body.size || DEFAULT_SIZE_ID) as HardwarePresetId;
  const preset =
    options.sizes.find((s) => s.id === requestedSize) ??
    options.sizes.find((s) => s.id === DEFAULT_SIZE_ID) ??
    options.sizes[0];

  if (!preset) {
    return NextResponse.json(
      { error: { message: "No hardware presets available" } },
      { status: 500 }
    );
  }

  const sizeId = preset.id;
  const hoursPerDay = clamp(body.hoursPerDay ?? 8, 0, 24);

  const hourly = Number(preset.costPerHour.toFixed(4));
  const daily = Number((hourly * hoursPerDay).toFixed(4));
  const monthly = Number((daily * 30).toFixed(2));

  return NextResponse.json({
    provider: SUPPORTED_PROVIDER_ID,
    sizeId,
    hardware: preset,
    hoursPerDay,
    cost: {
      hourly,
      daily,
      monthly,
      currency: "USD",
    },
    updatedAt: Date.now(),
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
