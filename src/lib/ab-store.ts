import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface ABVariantOutcome {
    impressions: number;
    clicks: number;
    watchTimeSeconds: number;
    updatedAt: string;
}

export interface ABExperiment {
    id: string;
    name: string;
    testType: "thumbnail" | "title" | "description";
    variantAName: string;
    variantBName: string;
    createdAt: string;
    ownerId: string;
    outcomeA: ABVariantOutcome;
    outcomeB: ABVariantOutcome;
}

interface StoreData {
    experiments: ABExperiment[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "ab-experiments.json");

async function ensureFile() {
    await mkdir(DATA_DIR, { recursive: true });
    try {
        await readFile(FILE, "utf8");
    } catch {
        await writeFile(FILE, JSON.stringify({ experiments: [] }, null, 2), "utf8");
    }
}

async function readStore(): Promise<StoreData> {
    await ensureFile();
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return { experiments: Array.isArray(parsed.experiments) ? parsed.experiments : [] };
}

async function writeStore(data: StoreData) {
    await ensureFile();
    await writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function listExperimentsByOwner(ownerId: string): Promise<ABExperiment[]> {
    const store = await readStore();
    return store.experiments
        .filter((exp) => exp.ownerId === ownerId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 100);
}

export async function createExperiment(input: {
    ownerId: string;
    name: string;
    testType: "thumbnail" | "title" | "description";
    variantAName: string;
    variantBName: string;
}): Promise<ABExperiment> {
    const store = await readStore();
    const now = new Date().toISOString();
    const emptyOutcome: ABVariantOutcome = {
        impressions: 0,
        clicks: 0,
        watchTimeSeconds: 0,
        updatedAt: now,
    };
    const exp: ABExperiment = {
        id: randomUUID(),
        ownerId: input.ownerId,
        name: input.name,
        testType: input.testType,
        variantAName: input.variantAName,
        variantBName: input.variantBName,
        createdAt: now,
        outcomeA: { ...emptyOutcome },
        outcomeB: { ...emptyOutcome },
    };
    store.experiments.push(exp);
    await writeStore(store);
    return exp;
}

export async function logExperimentOutcome(input: {
    ownerId: string;
    experimentId: string;
    variant: "A" | "B";
    impressions: number;
    clicks: number;
    watchTimeSeconds: number;
}): Promise<ABExperiment | null> {
    const store = await readStore();
    const index = store.experiments.findIndex((exp) => exp.id === input.experimentId && exp.ownerId === input.ownerId);
    if (index < 0) return null;
    const target = store.experiments[index];
    const payload: ABVariantOutcome = {
        impressions: Math.max(0, Math.round(input.impressions)),
        clicks: Math.max(0, Math.round(input.clicks)),
        watchTimeSeconds: Math.max(0, Math.round(input.watchTimeSeconds)),
        updatedAt: new Date().toISOString(),
    };
    if (input.variant === "A") {
        target.outcomeA = payload;
    } else {
        target.outcomeB = payload;
    }
    store.experiments[index] = target;
    await writeStore(store);
    return target;
}
