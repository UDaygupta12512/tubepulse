import { randomUUID } from "crypto";
import type { LiveAnalyticsData } from "@/lib/youtube-live";
import { fetchLiveAnalytics } from "@/lib/youtube-live";

type JobStatus = "queued" | "running" | "completed" | "failed";

interface AnalyticsRefreshPayload {
    channelId: string;
    timeRange: string;
}

export interface BackgroundJob {
    id: string;
    type: "analytics_refresh";
    status: JobStatus;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;
    payload: AnalyticsRefreshPayload;
    result?: {
        analytics: LiveAnalyticsData;
    };
}

const jobs = new Map<string, BackgroundJob>();

function setJob(job: BackgroundJob) {
    jobs.set(job.id, job);
}

export function getJob(jobId: string): BackgroundJob | null {
    return jobs.get(jobId) ?? null;
}

export function createAnalyticsRefreshJob(payload: AnalyticsRefreshPayload): BackgroundJob {
    const job: BackgroundJob = {
        id: randomUUID(),
        type: "analytics_refresh",
        status: "queued",
        createdAt: new Date().toISOString(),
        payload,
    };
    setJob(job);

    setTimeout(async () => {
        const existing = jobs.get(job.id);
        if (!existing) return;
        existing.status = "running";
        existing.startedAt = new Date().toISOString();
        setJob(existing);

        try {
            const analytics = await fetchLiveAnalytics(payload.channelId, payload.timeRange);
            existing.status = "completed";
            existing.completedAt = new Date().toISOString();
            existing.result = { analytics };
            setJob(existing);
        } catch (error) {
            existing.status = "failed";
            existing.completedAt = new Date().toISOString();
            existing.error = error instanceof Error ? error.message : "Unknown job error.";
            setJob(existing);
        }
    }, 150);

    return job;
}
