import { NextResponse } from "next/server";

// In-memory dynamic data to simulate real-time updates
const state = {
  monthTotal: 4820,
  computeCost: 3200,
  storageCost: 950,
  networkCost: 670,
  compute: { instances: 12, vcpuHours: 390, gpuHours: 24, region: "us-east-1" },
  storage: { totalGb: 120, snapshots: 16, avgOpsPerDay: 10000 },
  network: { dataOutGb: 420, bandwidthMb: 310, regionsActive: 3 },
};

function jitter(n: number, delta: number) {
  const d = (Math.random() - 0.5) * 2 * delta;
  return Math.max(0, Math.round((n + d) * 100) / 100);
}

export async function GET() {
  // Nudge values a bit to simulate changes
  state.computeCost = jitter(state.computeCost, 5);
  state.storageCost = jitter(state.storageCost, 2);
  state.networkCost = jitter(state.networkCost, 2);
  state.monthTotal = Math.round((state.computeCost + state.storageCost + state.networkCost) * 100) / 100;

  state.compute.vcpuHours = Math.round(state.compute.vcpuHours + Math.random() * 3);
  state.storage.avgOpsPerDay = Math.round(state.storage.avgOpsPerDay + (Math.random() - 0.5) * 100);
  state.network.bandwidthMb = Math.round(state.network.bandwidthMb + (Math.random() - 0.5) * 5);

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return NextResponse.json({
    monthTotal: state.monthTotal,
    computeCost: state.computeCost,
    storageCost: state.storageCost,
    networkCost: state.networkCost,
    cycle: {
      start: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      end: end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    },
    computeUsage: state.compute,
    storageUsage: state.storage,
    networkUsage: state.network,
    details: {
      plan: "Pro Developer Plan",
      accountEmail: "ritesh@cloudidex.com",
      payment: "Visa **** 4872",
      nextInvoice: new Date(today.getFullYear(), today.getMonth() + 1, 1).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    },
    updatedAt: new Date().toISOString(),
  });
}
