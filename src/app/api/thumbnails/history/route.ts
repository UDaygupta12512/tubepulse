import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addThumbnailHistoryItem, getThumbnailHistoryForUser } from "@/lib/thumbnail-history-store";

type RequestBody = {
    prompt?: string;
    keywords?: string;
    style?: string;
    template?: {
        primaryColor?: string;
        accentColor?: string;
        fontFamily?: string;
        logoArea?: string;
    };
    thumbnails?: Array<{
        label?: string;
        ctr?: number;
        dataUrl?: string;
        explanation?: string;
        downloadName?: string;
    }>;
};

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const items = await getThumbnailHistoryForUser(userId);
    return NextResponse.json({ items }, { status: 200 });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    if (!userId) {
        return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    let body: RequestBody;
    try {
        body = (await req.json()) as RequestBody;
    } catch {
        return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
    }

    const prompt = body.prompt?.trim() ?? "";
    const style = body.style?.trim() ?? "";
    const keywords = body.keywords?.trim() ?? "";
    const thumbs = Array.isArray(body.thumbnails) ? body.thumbnails : [];

    if (!prompt || !style || thumbs.length === 0) {
        return NextResponse.json({ message: "Missing required thumbnail history fields." }, { status: 400 });
    }

    await addThumbnailHistoryItem({
        id: randomUUID(),
        userId,
        prompt,
        keywords,
        style,
        template: body.template ? {
            primaryColor: body.template.primaryColor ?? "#ff1744",
            accentColor: body.template.accentColor ?? "#ffeb3b",
            fontFamily: body.template.fontFamily ?? "Arial",
            logoArea: body.template.logoArea ?? "bottom-right",
        } : undefined,
        createdAt: new Date().toISOString(),
        thumbnails: thumbs.map((thumb, idx) => ({
            label: thumb.label?.trim() || `Design ${idx + 1}`,
            ctr: typeof thumb.ctr === "number" ? thumb.ctr : 0,
            dataUrl: thumb.dataUrl ?? "",
            explanation: thumb.explanation?.trim() || "Built for strong visual hierarchy and CTR lift.",
            downloadName: thumb.downloadName?.trim() || `thumbnail-${idx + 1}.png`,
        })),
    });

    return NextResponse.json({ message: "Saved." }, { status: 201 });
}
