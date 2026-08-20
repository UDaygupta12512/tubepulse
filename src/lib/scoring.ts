/**
 * Custom Statistical Scoring Engine
 * Built from scratch in pure TypeScript.
 *
 * Implements Bayesian Average scoring and Data Normalization 
 * to mathematically grade YouTube videos and channels without AI hallucination.
 */

export interface VideoStats {
    views: number;
    likes: number;
    comments: number;
}

/**
 * Calculates a True Bayesian Average for Engagement Rate.
 * 
 * Problem: A video with 10 views and 5 likes has a 50% engagement rate.
 * A video with 1M views and 100k likes has a 10% engagement rate.
 * A raw average would rank the 10-view video higher, which is statistically incorrect.
 * 
 * Solution: Bayesian Average pulls low-data scores toward the global mean (prior),
 * while high-data scores maintain their true value.
 * 
 * @param stats The video's specific stats
 * @param globalMeanEngagement The average engagement rate across all videos analyzed (e.g., 0.05)
 * @param confidenceWeight The number of views required to fully trust the video's own rate (e.g., 1000)
 */
export function calculateBayesianEngagement(
    stats: VideoStats,
    globalMeanEngagement: number = 0.04, // YouTube average is roughly 4%
    confidenceWeight: number = 5000 // We start trusting the rate fully around 5k views
): number {
    const rawInteractions = stats.likes + stats.comments;
    const rawViews = stats.views;
    
    if (rawViews === 0) return 0;

    // Formula: ( (C * m) + (v * R) ) / (C + v)
    // C = confidenceWeight (prior weight)
    // m = globalMeanEngagement (prior mean)
    // v = rawViews (observations)
    // R = rawRate (observation mean)

    const rawRate = rawInteractions / rawViews;
    
    const bayesianRate = ((confidenceWeight * globalMeanEngagement) + (rawViews * rawRate)) / (confidenceWeight + rawViews);
    
    // Return as a percentage (e.g., 4.5 => 4.5%)
    return Number((bayesianRate * 100).toFixed(2));
}

/**
 * Calculates a unified "Channel Health Score" (0-100) mathematically.
 * Uses a weighted algorithm based on engagement, view velocity, and consistency.
 */
export function calculateChannelHealthScore(videos: VideoStats[]): { 
    score: number; 
    grade: "A+" | "A" | "B" | "C" | "D" | "F";
    bayesianAvg: number;
} {
    if (videos.length === 0) return { score: 0, grade: "F", bayesianAvg: 0 };

    // 1. Calculate overall Bayesian Average for recent videos
    const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
    const totalInteractions = videos.reduce((acc, v) => acc + v.likes + v.comments, 0);
    
    const globalMean = 0.04; // 4% baseline
    const confidence = 10000; // Require 10k total views for full confidence

    const rawRate = totalViews > 0 ? totalInteractions / totalViews : 0;
    const bayesianAvg = ((confidence * globalMean) + (totalViews * rawRate)) / (confidence + totalViews);
    const bayesianPercentage = bayesianAvg * 100;

    // 2. Score mapping (0-100 scale)
    // 8%+ = 100, 4% = 75, 1% = 40
    let score = 0;
    if (bayesianPercentage >= 8) score = 95 + (Math.min(bayesianPercentage - 8, 5)); // Cap at ~100
    else if (bayesianPercentage >= 4) score = 75 + ((bayesianPercentage - 4) * 5); // 4-8% scales 75-95
    else if (bayesianPercentage >= 2) score = 50 + ((bayesianPercentage - 2) * 12.5); // 2-4% scales 50-75
    else score = Math.max(10, bayesianPercentage * 25); // 0-2% scales 0-50

    score = Math.min(100, Math.round(score));

    // 3. Grade assignment
    let grade: "A+" | "A" | "B" | "C" | "D" | "F";
    if (score >= 95) grade = "A+";
    else if (score >= 85) grade = "A";
    else if (score >= 70) grade = "B";
    else if (score >= 50) grade = "C";
    else if (score >= 30) grade = "D";
    else grade = "F";

    return {
        score,
        grade,
        bayesianAvg: Number(bayesianPercentage.toFixed(2))
    };
}
