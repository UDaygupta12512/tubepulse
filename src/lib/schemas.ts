import { z } from "zod";

// ------------------------------------
// Content Generator Schema
// ------------------------------------
export const ContentResultSchema = z.object({
    chain_of_thought_title_critique: z.string().optional(),
    titles: z.array(
        z.object({
            title: z.string(),
            angle: z.string(),
            predicted_ctr: z.string(),
        })
    ).min(1),
    description: z.string().min(1),
    chapters: z.array(
        z.object({
            timestamp: z.string(),
            title: z.string(),
        })
    ).optional().default([]),
    engagement_assets: z.object({
        pinned_comment: z.string(),
        community_post: z.string(),
    }).optional(),
    tags: z.array(z.string()).optional().default([]),
    thumbnailIdeas: z.array(z.string()).optional().default([]),
    metadata_health: z.object({
        title_length_check: z.string(),
        description_seo_check: z.string(),
        is_title_optimized: z.boolean(),
    }).optional(),
});

export type ContentResult = z.infer<typeof ContentResultSchema>;

// ------------------------------------
// Script Generator Schema
// ------------------------------------
const AVRowSchema = z.object({
    timestamp: z.string(),
    audio: z.string(),
    visual: z.string(),
    pacing_note: z.string(),
});

const ScriptSectionSchema = z.object({
    title: z.string(),
    time: z.string(),
    retention_risk_score: z.number().min(0).max(100).optional(),
    retention_warning: z.string().optional(),
    av_rows: z.array(AVRowSchema).min(1),
});

export const ScriptResultSchema = z.object({
    chain_of_thought_niche_analysis: z.string().optional(),
    title: z.string().min(1),
    duration: z.string(),
    ab_hooks: z.array(
        z.object({
            type: z.string(),
            text: z.string(),
            visual_hook: z.string(),
        })
    ).min(1),
    sections: z.array(ScriptSectionSchema).min(1),
    engagement_boosters: z.array(z.string()).optional().default([]),
    keywords: z.array(z.string()).optional().default([]),
});

export type ScriptResult = z.infer<typeof ScriptResultSchema>;

// ------------------------------------
// Validation helper with auto-retry
// ------------------------------------
export async function validateWithRetry<T>(
    schema: z.ZodSchema<T>,
    fetchFn: () => Promise<T>,
    maxRetries = 2
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const raw = await fetchFn();
            const parsed = schema.parse(raw);
            return parsed;
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < maxRetries) {
                console.warn(
                    `[Zod Validation] Attempt ${attempt + 1} failed. AI returned invalid schema. Retrying...`,
                    lastError.message
                );
            }
        }
    }

    throw new Error(`AI returned invalid data after ${maxRetries + 1} attempts: ${lastError?.message}`);
}
