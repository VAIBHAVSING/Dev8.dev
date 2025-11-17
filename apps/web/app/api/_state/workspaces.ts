// Shared in-memory workspace state for dev/demo. Not for production use.

export type WorkspaceState = {
  id: string;
  name: string;
  provider: string; // aws | gcp | azure | local
  size: string; // small | medium | large
  region: string; // us-east | etc
  status: "running" | "stopped";
  metrics: {
    cpu: number; // percent
    memory: { usedGb: number; totalGb: number };
    disk: { usedGb: number; totalGb: number };
    network: { inMb: number; outMb: number };
  };
  terminal: string[];
  snapshots: Array<{ id: string; createdAt: number; location: string }>;
  assistant: { tips: string[]; note: string };
  lastUpdate: number;
};

const store = new Map<string, WorkspaceState>();

let seed = Date.now() % 100000;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

export function jitter(n: number, pct = 0.15, min = 0, max = Number.POSITIVE_INFINITY) {
  const j = 1 + (rnd() * 2 - 1) * pct;
  const v = Math.max(min, Math.min(max, n * j));
  return Math.round(v * 100) / 100;
}

function defaultTips(name: string) {
  return [
    "You can improve startup time by updating packages.",
    "Enable hot-reload caching for faster builds.",
    `Run tests in watch mode inside ${name} for quicker feedback.`,
  ];
}

export function ensureWorkspace(id: string): WorkspaceState {
  const key = String(id);
  if (store.has(key)) return store.get(key)!;
  const sizes = { small: { cpu: 2, ram: 4 }, medium: { cpu: 4, ram: 8 }, large: { cpu: 8, ram: 16 } } as const;
  const keys = Object.keys(sizes) as Array<keyof typeof sizes>;
  const pickSize = keys[Math.floor(rnd() * keys.length)] ?? "small";
  const ws: WorkspaceState = {
    id: key,
    name: `my-nextjs-app-${key}`,
    provider: "aws",
  size: String(pickSize),
    region: "us-east-1",
    status: "running",
    metrics: {
      cpu: Math.round(25 + rnd() * 40),
  memory: { usedGb: Math.round(2 + rnd() * 6), totalGb: sizes[pickSize].ram },
      disk: { usedGb: Math.round(20 + rnd() * 40), totalGb: 100 },
      network: { inMb: Math.round(80 + rnd() * 80), outMb: Math.round(120 + rnd() * 120) },
    },
    terminal: [
      `ritesh@cloudidex:~$ npm run dev`,
      `> web@ dev`,
      `Server ready on http://localhost:3000 🚀`,
    ],
    snapshots: [],
    assistant: { tips: defaultTips(`app-${key}`), note: "Predicted CPU load ~60% in next 10 mins" },
    lastUpdate: Date.now(),
  };
  store.set(key, ws);
  return ws;
}

export function getStore() {
  return store;
}
