import * as fs from "fs";
import * as path from "path";

export interface MemoryRecord {
    id: string;
    text: string;
    vector: number[];
    metadata: any;
    createdAt: number;
}

const MEMORY_FILE_PATH = path.join(process.cwd(), ".youtube_agent_memory.json");
const VECTOR_DIMENSIONS = 256; // Fixed size using Hashing Trick

/**
 * Super lightweight hashing function (djb2) to map words to vector indices.
 */
function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
}

/**
 * Converts text into a mathematical vector (array of numbers).
 * We use the "Hashing Trick" to map any vocabulary into a fixed 256-dimensional space.
 * This is incredibly efficient and requires 0 external AI APIs.
 */
export function vectorizeText(text: string): number[] {
    const vector = new Array(VECTOR_DIMENSIONS).fill(0);
    const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    
    for (const word of words) {
        if (word.length < 3) continue; // Skip stop words/small words
        const index = hashString(word) % VECTOR_DIMENSIONS;
        vector[index] += 1;
    }
    
    // Normalize the vector (L2 norm)
    let magnitude = 0;
    for (const val of vector) magnitude += val * val;
    magnitude = Math.sqrt(magnitude);
    
    if (magnitude > 0) {
        for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
            vector[i] /= magnitude;
        }
    }
    
    return vector;
}

/**
 * Calculates the geometric angle/similarity between two vectors.
 * 1.0 = identical, 0.0 = completely orthogonal (different).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
        dotProduct += vecA[i] * vecB[i];
    }
    return dotProduct; // Already normalized, so dot product == cosine similarity
}

function loadDatabase(): MemoryRecord[] {
    try {
        if (fs.existsSync(MEMORY_FILE_PATH)) {
            const data = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Failed to load Vector DB", error);
    }
    return [];
}

function saveDatabase(records: MemoryRecord[]) {
    try {
        fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
    } catch (error) {
        console.error("Failed to save Vector DB", error);
    }
}

/**
 * Saves a new strategy or script into the Long-Term Memory Database.
 */
export function memorize(text: string, metadata: any = {}) {
    const records = loadDatabase();
    
    const newRecord: MemoryRecord = {
        id: Math.random().toString(36).substring(7),
        text,
        vector: vectorizeText(text),
        metadata,
        createdAt: Date.now()
    };
    
    records.push(newRecord);
    
    // Cap memory to 50 items to prevent massive disk bloat
    if (records.length > 50) records.shift();
    
    saveDatabase(records);
}

/**
 * Searches the Long-Term Memory for the most mathematically similar past data.
 */
export function searchMemory(query: string, topK: number = 2): MemoryRecord[] {
    const records = loadDatabase();
    if (records.length === 0) return [];
    
    const queryVector = vectorizeText(query);
    
    const scoredRecords = records.map(record => ({
        record,
        score: cosineSimilarity(queryVector, record.vector)
    }));
    
    // Sort by highest similarity
    scoredRecords.sort((a, b) => b.score - a.score);
    
    // Only return highly relevant memories (Score > 0.15)
    return scoredRecords
        .filter(r => r.score > 0.15)
        .slice(0, topK)
        .map(r => r.record);
}
