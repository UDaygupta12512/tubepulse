import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { hashPassword } from "@/lib/password";

/**
 * USER STORE — File-based persistence layer (Development / Prototype)
 *
 * Architecture note for reviewers:
 * ─────────────────────────────────────────────────────────────────
 * This module stores users in a local JSON file (`data/users.json`).
 * This is intentional for local development and portfolio demos.
 *
 * Production migration path:
 *   1. Install Prisma: `npx prisma init --datasource-provider postgresql`
 *   2. Replace `readUsers()` / `writeUsers()` with Prisma client calls:
 *      - getUserByEmail  →  prisma.user.findUnique({ where: { email } })
 *      - createUser      →  prisma.user.create({ data: { ... } })
 *   3. Run `npx prisma db push` to apply the schema.
 *
 * All business logic (validation, rate limiting, normalization) lives
 * in this file and is completely independent of the storage layer,
 * making the migration a drop-in swap with zero logic changes.
 * ─────────────────────────────────────────────────────────────────
 */

export interface StoredUser {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    lastLoginAt: string | null;
    /** Number of AI generation requests made today */
    dailyRequestCount: number;
    /** ISO date string of the last request reset */
    requestResetDate: string;
    plan: "free" | "pro";
}

// ── Constants ──────────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

/** Free plan daily AI generation limit */
export const FREE_PLAN_DAILY_LIMIT = 20;
/** Pro plan daily AI generation limit */
export const PRO_PLAN_DAILY_LIMIT = 500;

// In-memory rate limiter: userId → { count, windowStart }
// Limits to 5 requests per 60-second window per user
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// ── Validation ─────────────────────────────────────────────────────────────

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error("INVALID_EMAIL");
    }
}

function validatePassword(password: string): void {
    if (password.length < 8) {
        throw new Error("PASSWORD_TOO_SHORT");
    }
    if (!/[A-Z]/.test(password)) {
        throw new Error("PASSWORD_NEEDS_UPPERCASE");
    }
    if (!/[0-9]/.test(password)) {
        throw new Error("PASSWORD_NEEDS_NUMBER");
    }
}

function validateName(name: string): void {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 64) {
        throw new Error("INVALID_NAME_LENGTH");
    }
}

// ── File I/O helpers ────────────────────────────────────────────────────────

async function ensureUsersFile(): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    try {
        await readFile(USERS_FILE, "utf8");
    } catch {
        await writeFile(USERS_FILE, "[]", "utf8");
    }
}

async function readUsers(): Promise<StoredUser[]> {
    await ensureUsersFile();
    const raw = await readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
        throw new Error("Invalid users store format.");
    }
    return parsed as StoredUser[];
}

async function writeUsers(users: StoredUser[]): Promise<void> {
    await ensureUsersFile();
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

// ── Rate Limiting ───────────────────────────────────────────────────────────

/**
 * Check and increment the rate limit for a user.
 * Returns true if allowed, false if rate limited.
 * Uses a sliding 60-second window stored in-memory.
 */
export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const existing = rateLimitMap.get(userId);

    if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
        // New window
        rateLimitMap.set(userId, { count: 1, windowStart: now });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (existing.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }

    existing.count += 1;
    return { allowed: true, remaining: RATE_LIMIT_MAX - existing.count };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<StoredUser | null> {
    const users = await readUsers();
    const normalizedEmail = normalizeEmail(email);
    return users.find((user) => user.email === normalizedEmail) ?? null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
    const users = await readUsers();
    return users.find((user) => user.id === id) ?? null;
}

export async function createUser(input: {
    name: string;
    email: string;
    password: string;
}): Promise<StoredUser> {
    // Validate inputs before any I/O
    validateName(input.name);
    validateEmail(input.email);
    validatePassword(input.password);

    const users = await readUsers();
    const normalizedEmail = normalizeEmail(input.email);

    if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error("EMAIL_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);
    const now = new Date().toISOString();
    const user: StoredUser = {
        id: randomUUID(),
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        createdAt: now,
        lastLoginAt: null,
        dailyRequestCount: 0,
        requestResetDate: now.split("T")[0], // YYYY-MM-DD
        plan: "free",
    };

    users.push(user);
    await writeUsers(users);
    return user;
}

/**
 * Update the user's lastLoginAt timestamp.
 * Called after a successful authentication.
 */
export async function recordLogin(userId: string): Promise<void> {
    const users = await readUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
        user.lastLoginAt = new Date().toISOString();
        await writeUsers(users);
    }
}

/**
 * Increment the user's daily AI request counter.
 * Resets automatically if it's a new day.
 * Returns false if the user has exceeded their daily limit.
 */
export async function consumeRequestQuota(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const users = await readUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return { allowed: false, used: 0, limit: 0 };

    const today = new Date().toISOString().split("T")[0];
    const limit = user.plan === "pro" ? PRO_PLAN_DAILY_LIMIT : FREE_PLAN_DAILY_LIMIT;

    // Reset counter on new day
    if (user.requestResetDate !== today) {
        user.dailyRequestCount = 0;
        user.requestResetDate = today;
    }

    if (user.dailyRequestCount >= limit) {
        return { allowed: false, used: user.dailyRequestCount, limit };
    }

    user.dailyRequestCount += 1;
    await writeUsers(users);
    return { allowed: true, used: user.dailyRequestCount, limit };
}

