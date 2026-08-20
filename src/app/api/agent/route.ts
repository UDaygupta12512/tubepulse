import { NextResponse } from "next/server";
import { runAutonomousAgent } from "@/lib/agents";
import { checkRateLimit } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Agentic loops take time

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const rateLimit = checkRateLimit(`agent_${ip}`);
        
        if (!rateLimit.allowed) {
            return new Response("Too many requests", { status: 429 });
        }

        const { goal } = await req.json();

        if (!goal || typeof goal !== "string") {
            return new Response("Missing goal", { status: 400 });
        }

        const encoder = new TextEncoder();
        
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Start the multi-agent loop
                    const agentGenerator = runAutonomousAgent(goal);
                    
                    for await (const update of agentGenerator) {
                        // Send Server-Sent Events (SSE) formatted text
                        const dataString = `data: ${JSON.stringify(update)}\n\n`;
                        controller.enqueue(encoder.encode(dataString));
                    }
                    
                } catch (error: any) {
                    console.error("Agent Loop Error:", error);
                    const errorMsg = `data: ${JSON.stringify({ agent: "System", status: "Agent process failed. " + error.message, isComplete: true })}\n\n`;
                    controller.enqueue(encoder.encode(errorMsg));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Failed to initialize agent" }, { status: 500 });
    }
}
