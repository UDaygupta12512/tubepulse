import { NextResponse } from "next/server";
import { getJob } from "@/lib/job-store";

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    const job = getJob(id);
    if (!job) {
        return NextResponse.json({ message: "Job not found." }, { status: 404 });
    }
    return NextResponse.json({ job }, { status: 200 });
}
