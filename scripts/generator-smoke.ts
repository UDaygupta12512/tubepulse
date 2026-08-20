import {
    generateKeywordResults,
    generateContentResults,
    generateScriptSections,
    generateHashtags,
    generateCompetitorData,
    generateOutlierData,
    generateAnalyticsData,
    generateOptimizeData,
    generateThumbnailSearchResults,
    generateABTestResults,
    generateOptimizeInsights,
    generateDashboardStats,
} from "../src/lib/generators";

function assert(condition: unknown, message: string) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertNonEmptyString(value: unknown, name: string) {
    assert(typeof value === "string" && value.trim().length > 0, `${name} should be a non-empty string`);
}

function parsePercent(value: string): number {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    assert(Number.isFinite(parsed), `invalid percent value: ${value}`);
    return parsed;
}

const textInputs = [
    "",
    "   ",
    "ai",
    "AI automation for creators",
    "<script>alert(1)</script>",
    "../../etc/passwd",
    "DROP TABLE videos;",
    "x".repeat(300),
    "How to grow on youtube in 2026",
];

const rangeInputs = ["7d", "30d", "90d", "1y", "", "invalid"];
const categoryInputs = ["all", "tech", "business", "education", "lifestyle", "unknown", ""];
const styleInputs = ["educational", "entertainment", "vlog", "documentary", "review", "invalid", ""];
const toneInputs = ["professional", "casual", "hype", "storytelling", "invalid", ""];

for (const seed of textInputs) {
    const keywords = generateKeywordResults(seed);
    assert(Array.isArray(keywords) && keywords.length >= 4, "keyword results should return >= 4 rows");
    for (const row of keywords) {
        assertNonEmptyString(row.keyword, "keyword");
        assert(/^\d+(\.\d+)?[KM]$/.test(row.volume), `keyword volume format invalid: ${row.volume}`);
        assert(["Low", "Medium", "High"].includes(row.difficulty), "keyword difficulty invalid");
        assert(parsePercent(row.trend) >= 0, "keyword trend should be non-negative");
        assert(row.competition >= 0 && row.competition <= 100, "keyword competition out of range");
        assert(row.opportunity >= 0 && row.opportunity <= 100, "keyword opportunity out of range");
    }

    const hashtags = generateHashtags(seed);
    assert(hashtags.trending.length > 0, "hashtags.trending should be non-empty");
    assert(hashtags.niche.length > 0, "hashtags.niche should be non-empty");
    assert(hashtags.longTail.length > 0, "hashtags.longTail should be non-empty");

    const thumbnail = generateThumbnailSearchResults(seed, "all");
    assert(thumbnail.length > 0, "thumbnail search should return results");
    for (const row of thumbnail) {
        assertNonEmptyString(row.title, "thumbnail title");
        assert(parsePercent(row.ctr) > 0, "thumbnail ctr should be > 0");
        assert(row.score >= 0 && row.score <= 100, "thumbnail score out of range");
    }

    const content = generateContentResults(seed, toneInputs[Math.floor(Math.random() * toneInputs.length)]);
    assert(content.titles.length >= 3, "content titles should be generated");
    assertNonEmptyString(content.description, "content description");
    assert(content.tags.length >= 3, "content tags should be generated");

    const script = generateScriptSections(seed, String(Math.floor(Math.random() * 180) - 40), styleInputs[Math.floor(Math.random() * styleInputs.length)]);
    assert(script.sections.length >= 2, "script should contain sections");
    assertNonEmptyString(script.hook.time, "script hook time");
    assertNonEmptyString(script.outro.time, "script outro time");

    const competitor = generateCompetitorData(seed);
    assertNonEmptyString(competitor.channel.name, "competitor channel name");
    assert(competitor.contentThemes.length === 3, "competitor themes length should be 3");
    const totalThemePercent = competitor.contentThemes.reduce((sum, t) => sum + t.percentage, 0);
    assert(totalThemePercent === 100, `competitor theme percentages should add to 100, got ${totalThemePercent}`);

    const ab = generateABTestResults("thumbnail", seed, `Variant-${seed}`);
    assert(["a", "b"].includes(ab.winner), "ab winner should be a or b");
    assert(parsePercent(ab.improvement) >= 0, "ab improvement should be non-negative");
    assert(ab.confidence >= 60 && ab.confidence <= 100, "ab confidence out of range");
}

for (const tone of toneInputs) {
    const result = generateContentResults("content strategy", tone);
    assert(result.tags.every((tag) => tag.startsWith("#")), "all tags should begin with #");
}

for (const style of styleInputs) {
    const result = generateScriptSections("channel growth", "-20", style);
    assert(result.sections.length >= 2, "style run should still produce sections");
}

for (const category of categoryInputs) {
    const results = generateOutlierData(category);
    assert(Array.isArray(results), "outlier results should be an array");
    assert(results.length > 0, "outlier results should not be empty");
    for (const outlier of results) {
        assert(/x$/.test(outlier.multiplier), "outlier multiplier should end with x");
        assert(outlier.viralScore >= 0 && outlier.viralScore <= 100, "outlier viral score out of range");
    }
}

for (const range of rangeInputs) {
    const analytics = generateAnalyticsData(range);
    assert(analytics.stats.length === 4, "analytics stats should be 4 rows");
    assert(analytics.chartData.length > 0, "analytics chart data should not be empty");

    const optimize = generateOptimizeData(range);
    assert(optimize.stats.length === 4, "optimize stats should be 4 rows");
    assert(optimize.topVideos.length > 0, "optimize top videos should not be empty");

    const insights = generateOptimizeInsights(range);
    assert(insights.length === 4, "optimize insights should include 4 items");
}

const dashboard = generateDashboardStats();
assertNonEmptyString(dashboard.channelViews, "dashboard.channelViews");
assert(Array.isArray(dashboard.recentActivity) && dashboard.recentActivity.length > 0, "dashboard activity should be non-empty");

console.log("Generator smoke tests passed for malformed, empty, and extreme inputs.");
