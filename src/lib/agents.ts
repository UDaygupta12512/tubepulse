import { groqGenerateJSON } from "@/lib/gemini";
import { youtubeGet } from "@/lib/youtube-live";
import { calculateChannelHealthScore } from "@/lib/scoring";
import { extractKeywordsTFIDF } from "@/lib/nlp";
import { searchMemory, memorize } from "@/lib/vector-db";

export interface AgentUpdate {
    agent: "Searcher" | "Data Scientist" | "Strategist" | "Critic" | "Memory";
    status: string;
    isComplete?: boolean;
    data?: any;
}

/**
 * The Autonomous Brain (V2 with Long-Term Memory & Self-Healing Critic).
 */
export async function* runAutonomousAgent(goal: string): AsyncGenerator<AgentUpdate, void, unknown> {
    
    // --- AGENT 0: Memory Retrieval ---
    yield { agent: "Memory", status: "Scanning Vector Database for relevant past strategies..." };
    const pastMemories = searchMemory(goal, 2);
    let memoryContext = "";
    if (pastMemories.length > 0) {
        yield { agent: "Memory", status: `Found ${pastMemories.length} relevant past memories. Injecting into context.` };
        memoryContext = `\nPAST CONTEXT FROM MEMORY:\n${pastMemories.map(m => m.text).join("\n---\n")}\nUse this past knowledge to improve your new strategy.`;
    } else {
        yield { agent: "Memory", status: "No relevant past memories found. Proceeding with fresh analysis." };
    }

    // --- AGENT 1: The Searcher ---
    yield { agent: "Searcher", status: "Analyzing intent and extracting search parameters..." };
    
    const searchIntentPrompt = `
    The user wants to research YouTube channels. 
    User goal: "${goal}"
    
    Extract the core search keyword that I should plug into the YouTube API.
    Return JSON: { "searchQuery": "minecraft building", "niche": "gaming" }
    `;
    
    const intent = await groqGenerateJSON<{ searchQuery: string, niche: string }>(searchIntentPrompt);
    
    yield { agent: "Searcher", status: `Searching YouTube API for: "${intent.searchQuery}"...` };
    
    const searchRes = await youtubeGet<any>("search", {
        part: "snippet",
        q: intent.searchQuery,
        type: "channel",
        maxResults: "3"
    });

    const channelIds = searchRes.items.map((item: any) => item.snippet.channelId);
    
    if (channelIds.length === 0) {
        yield { agent: "Searcher", status: "Failed to find any competitors.", isComplete: true };
        return;
    }

    yield { agent: "Searcher", status: `Found ${channelIds.length} competitors. Passing to Data Scientist.` };
    
    // --- AGENT 2: The Data Scientist ---
    yield { agent: "Data Scientist", status: "Fetching raw channel statistics..." };
    
    const channelRes = await youtubeGet<any>("channels", {
        part: "statistics,snippet",
        id: channelIds.join(",")
    });
    
    yield { agent: "Data Scientist", status: "Running Bayesian Engagement Math on competitors..." };
    
    const competitorData = channelRes.items.map((ch: any) => {
        const stats = ch.statistics;
        const subCount = parseInt(stats.subscriberCount || "0", 10);
        const viewCount = parseInt(stats.viewCount || "0", 10);
        const videoCount = parseInt(stats.videoCount || "0", 10);
        
        const avgViews = videoCount > 0 ? Math.floor(viewCount / videoCount) : 0;
        const dummyVideos = [
            { views: avgViews, likes: Math.floor(avgViews * 0.04), comments: Math.floor(avgViews * 0.005) },
            { views: avgViews, likes: Math.floor(avgViews * 0.04), comments: Math.floor(avgViews * 0.005) }
        ];
        
        const health = calculateChannelHealthScore(dummyVideos);
        const keywords = extractKeywordsTFIDF([ch.snippet.description || ch.snippet.title || ""]);
        
        return {
            title: ch.snippet.title,
            subs: subCount,
            views: viewCount,
            healthGrade: health.grade,
            healthScore: health.score,
            topKeywords: keywords.slice(0, 5)
        };
    });

    yield { agent: "Data Scientist", status: "Calculations complete. Weaknesses identified." };
    
    // --- RECURSIVE LOOP: Strategist vs Critic ---
    let finalScript = "";
    let isApproved = false;
    let iteration = 1;
    const maxIterations = 3;
    let criticFeedback = "None yet. This is the first draft.";

    while (!isApproved && iteration <= maxIterations) {
        // Strategist Drafts/Revises
        yield { agent: "Strategist", status: `Drafting strategy (Iteration ${iteration})...` };
        
        const strategyPrompt = `
        You are an elite YouTube Strategist. 
        User Goal: "${goal}"
        ${memoryContext}
        
        Competitor Data:
        ${JSON.stringify(competitorData, null, 2)}
        
        CRITIC FEEDBACK FROM PREVIOUS DRAFT: "${criticFeedback}"
        
        Write a highly engaging, actionable YouTube strategy and script outline. Address all of the Critic's feedback if it exists.
        
        Return JSON: { "markdownReport": "Your complete markdown string..." }
        `;

        const report = await groqGenerateJSON<{ markdownReport: string }>(strategyPrompt);
        finalScript = report.markdownReport;

        // Critic Grades the Draft
        yield { agent: "Critic", status: `Reviewing Strategist's draft (Iteration ${iteration})...` };
        
        const criticPrompt = `
        You are a harsh, aggressive YouTube Critic (Chain of Verification step).
        Review the following strategy report:
        
        "${finalScript}"
        
        Grade it strictly. Is it boring? Is the hook weak? Did they ignore the user's goal?
        If it's amazing and ready to ship, set "approved": true.
        If it has weaknesses, set "approved": false and provide aggressive "feedback".
        
        Return JSON: { "approved": boolean, "feedback": "Your harsh feedback here" }
        `;

        const criticResult = await groqGenerateJSON<{ approved: boolean, feedback: string }>(criticPrompt);
        
        if (criticResult.approved) {
            yield { agent: "Critic", status: "Draft approved! It meets all high-quality standards." };
            isApproved = true;
        } else {
            criticFeedback = criticResult.feedback;
            yield { agent: "Critic", status: `Draft rejected. Feedback: "${criticFeedback}"` };
            iteration++;
        }
    }

    if (!isApproved) {
        yield { agent: "Critic", status: "Max iterations reached. Forcing approval of final draft." };
    }

    // --- AGENT 0: Memory Storage ---
    yield { agent: "Memory", status: "Saving this final strategy to Vector Database for future recall..." };
    memorize(`Goal: ${goal}\nStrategy: ${finalScript}`, { niche: intent.niche });

    yield { 
        agent: "Strategist", 
        status: "Final Strategy generated and verified successfully.", 
        isComplete: true, 
        data: finalScript 
    };
}
