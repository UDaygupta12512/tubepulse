import { NextResponse } from "next/server";
import { createAnalyticsRefreshJob } from "@/lib/job-store";

interface JobRequestBody {
    type?: string;
    payload?: {
        channelId?: string;
        timeRange?: string;
    };
}

export async function POST(req: Request) {
    let body: JobRequestBody;
    try {
        body = (await req.json()) as JobRequestBody;
    } catch {
        return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
    }

    if (body.type !== "analytics_refresh") {
        return NextResponse.json({ message: "Unsupported job type." }, { status: 400 });
    }

    const channelId = body.payload?.channelId?.trim() ?? "";
    const timeRange = body.payload?.timeRange?.trim() ?? "30d";
    if (!channelId) {
        return NextResponse.json({ message: "channelId is required." }, { status: 400 });
    }

    const job = createAnalyticsRefreshJob({ channelId, timeRange });
    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
}
