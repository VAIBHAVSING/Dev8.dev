import { NextResponse } from "next/server";

type Body = {
  provider: string;
  size: "small" | "medium" | "large";
  region?: string;
  hoursPerDay?: number; // optional usage for estimate
};

const BASE_PRICING = {
  aws: { small: 0.07, medium: 0.16, large: 0.36 },
  gcp: { small: 0.065, medium: 0.15, large: 0.34 },
  azure: { small: 0.075, medium: 0.17, large: 0.38 },
  local: { small: 0.02, medium: 0.05, large: 0.1 },
} as const; // USD per hour

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const provider = (body.provider || "aws") as keyof typeof BASE_PRICING;
  const size = (body.size || "small") as keyof (typeof BASE_PRICING)["aws"];
  const hrs = typeof body.hoursPerDay === "number" ? Math.max(0, Math.min(24, body.hoursPerDay)) : 8;

  const hourly = BASE_PRICING[provider][size];
  const daily = hourly * hrs;
  const monthly = daily * 30;
  const currency = "USD";

  return NextResponse.json({
    provider,
    size,
    hoursPerDay: hrs,
    cost: { hourly, daily, monthly, currency },
    updatedAt: Date.now(),
  });
}
