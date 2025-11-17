import { NextResponse } from "next/server";

type Range = "last_24h" | "last_7d" | "last_30d" | "this_month";

let seed = Date.now() % 1000;
function rnd() {
  // simple deterministic PRNG for jitter
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

function jitter(n: number, pct = 0.1) {
  const j = 1 + (rnd() * 2 - 1) * pct;
  return Math.max(0, Math.round(n * j));
}

function makeTimeseries(points: number, base: number, volatility = 0.15) {
  const out: Array<{ t: number; v: number }> = [];
  let v = base;
  for (let i = points - 1; i >= 0; i--) {
    v = Math.max(0, v + (rnd() * 2 - 1) * base * volatility);
    out.push({ t: Date.now() - i * 60 * 60 * 1000, v: Math.round(v) });
  }
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = (searchParams.get("range") as Range) || "last_7d";

  const points = range === "last_24h" ? 24 : range === "last_7d" ? 7 * 24 : 30 * 24;

  const activeUsers = jitter(1280, 0.12);
  const builds = jitter(420, 0.2);
  const errors = jitter(18, 0.4);
  const cpu = Math.min(100, Math.max(3, Math.round(30 + rnd() * 50)));
  const memory = Math.min(100, Math.max(8, Math.round(40 + rnd() * 40)));
  const network = jitter(320, 0.25); // Mbps

  const topProjects = [
    { name: "ai-search-service", usage: jitter(34, 0.3) },
    { name: "web-frontend", usage: jitter(28, 0.3) },
    { name: "worker-queue", usage: jitter(22, 0.3) },
    { name: "analytics-pipeline", usage: jitter(16, 0.3) },
  ];

  const timeseries = {
    cpu: makeTimeseries(points, 55, 0.25),
    mem: makeTimeseries(points, 60, 0.2),
    net: makeTimeseries(points, 300, 0.35),
    builds: makeTimeseries(points, 18, 0.5),
    errors: makeTimeseries(points, 1.2, 0.8),
  };

  return NextResponse.json({
    range,
    summary: { activeUsers, builds, errors, cpu, memory, network },
    topProjects,
    timeseries,
    updatedAt: Date.now(),
  });
}
