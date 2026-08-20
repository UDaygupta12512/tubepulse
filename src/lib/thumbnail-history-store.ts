import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface ThumbnailHistoryItem {
    id: string;
    userId: string;
    prompt: string;
    keywords: string;
    style: string;
    template?: {
        primaryColor: string;
        accentColor: string;
        fontFamily: string;
        logoArea: string;
    };
    createdAt: string;
    thumbnails: Array<{
        label: string;
        ctr: number;
        dataUrl: string;
        explanation: string;
        downloadName: string;
    }>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "thumbnail-history.json");

interface HistoryFileShape {
    items: ThumbnailHistoryItem[];
}

async function ensureFile(): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    try {
        await readFile(HISTORY_FILE, "utf8");
    } catch {
        const initial: HistoryFileShape = { items: [] };
        await writeFile(HISTORY_FILE, JSON.stringify(initial, null, 2), "utf8");
    }
}

async function readHistory(): Promise<HistoryFileShape> {
    await ensureFile();
    const raw = await readFile(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<HistoryFileShape>;
    return { items: Array.isArray(parsed.items) ? parsed.items : [] };
}

async function writeHistory(data: HistoryFileShape): Promise<void> {
    await ensureFile();
    await writeFile(HISTORY_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getThumbnailHistoryForUser(userId: string): Promise<ThumbnailHistoryItem[]> {
    const store = await readHistory();
    return store.items
        .filter((item) => item.userId === userId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 20);
}

export async function addThumbnailHistoryItem(item: ThumbnailHistoryItem): Promise<void> {
    const store = await readHistory();
    store.items.push(item);

    // keep only most recent 1000 records globally
    store.items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    store.items = store.items.slice(0, 1000);
    await writeHistory(store);
}
