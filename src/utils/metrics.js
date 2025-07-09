"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeAllMetrics = computeAllMetrics;
function computeAllMetrics(profile, posts) {
    var _a, _b;
    const followerCount = profile.followers_count || 1;
    const followingCount = profile.follows_count || 1;
    // Totals
    const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
    const totalEngagement = totalLikes + totalComments;
    const avgLikesPerPost = totalLikes / (posts.length || 1);
    const avgCommentsPerPost = totalComments / (posts.length || 1);
    const engagementRate = ((totalEngagement / (posts.length || 1)) / followerCount) * 100;
    // Posting frequency (days)
    const dates = posts
        .map((p) => new Date(p.timestamp))
        .sort((a, b) => b.getTime() - a.getTime());
    const postingFrequency = dates.length > 1
        ? dates
            .slice(0, -1)
            .reduce((sum, d, i) => sum +
            (d.getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24), 0) /
            (dates.length - 1)
        : 0;
    // Best posting windows (with average engagement)
    const windowMap = {};
    const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
    ];
    posts.forEach((p) => {
        const d = new Date(p.timestamp);
        const slot = `${daysOfWeek[d.getDay()]} ${d.getHours()}:00`;
        if (!windowMap[slot])
            windowMap[slot] = { posts: 0, engagement: 0 };
        windowMap[slot].posts++;
        windowMap[slot].engagement += p.like_count + p.comments_count;
    });
    // Calculate average engagement per slot
    let bestPostingWindow = null;
    Object.entries(windowMap).forEach(([slot, data]) => {
        const avg = data.posts > 0 ? data.engagement / data.posts : 0;
        windowMap[slot].avgEngagement = avg;
        if (!bestPostingWindow || avg > bestPostingWindow.avgEngagement) {
            bestPostingWindow = { slot, avgEngagement: avg };
        }
    });
    const postingWindows = windowMap;
    // Hashtag stats
    const hashMap = {};
    const hashRx = /#([A-Za-z0-9_]+)/g;
    posts.forEach((p) => {
        var _a, _b;
        const tags = (_b = (_a = p.caption) === null || _a === void 0 ? void 0 : _a.match(hashRx)) !== null && _b !== void 0 ? _b : [];
        const eng = p.like_count + p.comments_count;
        tags.forEach((t) => {
            const tag = t.slice(1);
            if (!hashMap[tag])
                hashMap[tag] = { tag, count: 0, engagement: 0 };
            hashMap[tag].count++;
            hashMap[tag].engagement += eng;
        });
    });
    const hashtagStats = Object.values(hashMap).sort((a, b) => b.engagement / b.count - a.engagement / a.count);
    // Caption stats
    const lengths = posts.map((p) => { var _a, _b; return (_b = (_a = p.caption) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0; });
    const averageLength = lengths.reduce((s, l) => s + l, 0) / (posts.length || 1);
    const percentLongCaptions = posts.filter((p) => { var _a, _b; return ((_b = (_a = p.caption) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 200; }).length /
        (posts.length || 1);
    const captionStats = {
        averageLength,
        percentLongCaptions,
    };
    // Post type performance
    const typeMap = {};
    posts.forEach((p) => {
        if (!typeMap[p.media_type]) {
            typeMap[p.media_type] = {
                type: p.media_type,
                avgEngagement: 0,
                avgViews: 0,
                count: 0,
            };
        }
        const entry = typeMap[p.media_type];
        entry.count++;
        entry.avgEngagement += p.like_count + p.comments_count;
        entry.avgViews += p.video_views || 0;
    });
    const postTypePerformance = Object.values(typeMap).map((t) => ({
        type: t.type,
        avgEngagement: t.avgEngagement / t.count,
        avgViews: t.avgViews / t.count,
        count: t.count,
    }));
    // Top posts last 30 days
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recent = posts.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
    const topEngagement = (_a = recent
        .slice()
        .sort((a, b) => b.like_count +
        b.comments_count -
        (a.like_count + a.comments_count))[0]) !== null && _a !== void 0 ? _a : null;
    const topViews = (_b = recent
        .filter((p) => p.video_views)
        .sort((a, b) => { var _a, _b; return ((_a = b.video_views) !== null && _a !== void 0 ? _a : 0) - ((_b = a.video_views) !== null && _b !== void 0 ? _b : 0); })[0]) !== null && _b !== void 0 ? _b : null;
    // Detailed metrics
    const avgDays = postingFrequency.toFixed(1);
    const consistency = postingFrequency < 3 ? 'High' : postingFrequency < 7 ? 'Medium' : 'Low';
    const likesWeight = ((totalLikes / totalEngagement) * 100).toFixed(1) + '%';
    const commentsWeight = ((totalComments / totalEngagement) * 100).toFixed(1) + '%';
    return {
        engagementRate,
        avgLikesPerPost,
        avgCommentsPerPost,
        followerFollowingRatio: followerCount / followingCount,
        postingFrequency,
        postingWindows,
        hashtagStats,
        captionStats,
        postTypePerformance,
        topPosts: {
            topEngagement: topEngagement &&
                Object.assign(Object.assign({}, topEngagement), { totalEngagement: topEngagement.like_count + topEngagement.comments_count }),
            topViews,
        },
        detailedMetrics: {
            postingFrequency: { avgDays, consistency },
            engagementQuality: { likesWeight, commentsWeight },
        },
        bestPostingWindow,
    };
}
