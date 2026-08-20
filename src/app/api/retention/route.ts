import { NextResponse } from "next/server";
import { predictRetentionCurve, analyzeRetentionTimeline, PredictionInputs } from "@/lib/regression";
import { checkRateLimit } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const rateLimit = checkRateLimit(`retention_${ip}`);
        
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
        }

        const body: Partial<PredictionInputs> = await req.json();

        // Validate inputs
        const videoLengthMinutes = Number(body.videoLengthMinutes);
        const hookStrength = Number(body.hookStrength);
        const pacing = (body.pacing || "Normal") as "Fast" | "Normal" | "Slow";
        const category = (body.category || "Entertainment") as "Entertainment" | "Education" | "Gaming" | "Vlog" | "Other";

        if (
            isNaN(videoLengthMinutes) || videoLengthMinutes <= 0 || videoLengthMinutes > 120 ||
            isNaN(hookStrength) || hookStrength < 1 || hookStrength > 10 ||
            !["Fast", "Normal", "Slow"].includes(pacing) ||
            !["Entertainment", "Education", "Gaming", "Vlog", "Other"].includes(category)
        ) {
            return NextResponse.json({ error: "Invalid input parameters." }, { status: 400 });
        }

        const inputs: PredictionInputs = {
            videoLengthMinutes,
            hookStrength,
            pacing,
            category,
        };

        // 1. Run local mathematical regression curve engine (0 API tokens consumed)
        const curveData = predictRetentionCurve(inputs);

        // 2. Run timeline hazard diagnostics & milestones engine
        const analysis = analyzeRetentionTimeline(curveData, inputs);

        return NextResponse.json(analysis, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error: any) {
        console.error("Retention Prediction Error:", error);
        return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 });
    }
}
