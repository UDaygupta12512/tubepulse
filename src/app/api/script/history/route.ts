import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addHistoryItem, getHistoryForUser } from "@/lib/generators-history-store";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
        return NextResponse.json({ items: [] }, { status: 200 });
    }
    const items = getHistoryForUser(userId, "script");
    return NextResponse.json({ items }, { status: 200 });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: { topic?: string; style?: string; duration?: string; result?: Record<string, unknown> };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ message: "Invalid body" }, { status: 400 });
    }

    const topic = body.topic?.trim();
    if (!topic || !body.result) {
        return NextResponse.json({ message: "Missing topic or result" }, { status: 400 });
    }

    addHistoryItem({
        id: randomUUID(),
        userId,
        type: "script",
        topic,
        style: body.style?.trim() ?? "educational",
        duration: body.duration?.trim() ?? "10",
        result: body.result,
        createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Saved." }, { status: 201 });
}
