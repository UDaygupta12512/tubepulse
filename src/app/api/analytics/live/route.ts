import { NextResponse } from "next/server";
import { fetchLiveAnalytics } from "@/lib/youtube-live";
import { normalizeInputText } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const rawChannel = searchParams.get("channelId") ?? "";
    const channelId = normalizeInputText(rawChannel).trim();
    const timeRange = searchParams.get("timeRange") ?? "30d";

    if (!channelId) {
        return NextResponse.json({ message: "channelId is required." }, { status: 400 });
    }

    try {
        const analytics = await fetchLiveAnalytics(channelId, timeRange);
        return NextResponse.json({ analytics }, { 
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch analytics.";
        return NextResponse.json({ message }, { status: 500 });
    }
}
