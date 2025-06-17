const computeEngagementRate = (profile, posts) => {
    const followerCount = profile.followers_count || 1;
    const totalEngagement = posts.reduce((sum, post) => 
        sum + (post.like_count || 0) + (post.comments_count || 0), 0);
    return ((totalEngagement / followerCount) * 100).toFixed(1) + '%';
};

const computeEngagementByContentType = (profile, posts) => {
    const followerCount = profile.followers_count || 1;
    const byType = posts.reduce((acc, post) => {
        const type = post.media_type;
        if (!acc[type]) {
            acc[type] = { likes: 0, comments: 0, count: 0 };
        }
        acc[type].likes += (post.like_count || 0);
        acc[type].comments += (post.comments_count || 0);
        acc[type].count++;
        return acc;
    }, {});

    return Object.entries(byType).reduce((acc, [type, data]) => ({
        ...acc,
        [type]: ((data.likes + data.comments) / followerCount * 100).toFixed(1) + '%'
    }), {});
};

const computeAverageLikesAndComments = (profile, posts) => {
    const followerCount = profile.followers_count || 1;
    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);

    return {
        averageLikesPerFollower: (totalLikes / followerCount).toFixed(3),
        averageCommentsPerFollower: (totalComments / followerCount).toFixed(3)
    };
};

const computeFollowerFollowingRatio = (profile) => {
    const followingCount = profile.follows_count || 1;
    return (profile.followers_count / followingCount).toFixed(1);
};

const computePostingFrequency = (posts) => {
    const timestamps = posts.map(p => new Date(p.timestamp)).sort((a, b) => b - a);
    const avgDays = timestamps.length > 1 
        ? timestamps.slice(0, -1).reduce((sum, date, i) => 
            sum + (date - timestamps[i + 1]) / (1000 * 60 * 60 * 24), 0) / (timestamps.length - 1)
        : 0;
    
    return avgDays.toFixed(1) + 'd';
};

const computeBestPostingWindows = (posts) => {
    const windows = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    posts.forEach(post => {
        const date = new Date(post.timestamp);
        const dayName = daysOfWeek[date.getDay()];
        const hour = date.getHours();
        const timeSlot = `${dayName} ${hour}:00`;
        
        if (!windows[timeSlot]) {
            windows[timeSlot] = { posts: 0, engagement: 0 };
        }
        windows[timeSlot].posts++;
        windows[timeSlot].engagement += (post.like_count || 0) + (post.comments_count || 0);
    });

    return Object.entries(windows)
        .map(([timeSlot, data]) => ({
            timeSlot,
            avgEngagement: (data.engagement / data.posts).toFixed(1)
        }))
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, 5);
};

const getTopPosts = (posts) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPosts = posts.filter(p => new Date(p.timestamp) >= thirtyDaysAgo);
    
    const topEngagement = [...recentPosts].sort((a, b) => 
        ((b.like_count || 0) + (b.comments_count || 0)) - 
        ((a.like_count || 0) + (a.comments_count || 0))
    )[0];

    const topViews = [...recentPosts]
        .filter(p => p.video_views)
        .sort((a, b) => (b.video_views || 0) - (a.video_views || 0))[0];

    return {
        topEngagement: topEngagement ? {
            ...topEngagement,
            totalEngagement: (topEngagement.like_count || 0) + (topEngagement.comments_count || 0)
        } : null,
        topViews: topViews || null
    };
};

const analyzeHashtags = (posts) => {
    const hashtagCounts = {};
    posts.forEach(post => {
        const hashtags = (post.caption || '').match(/#[\w\u0590-\u05ff]+/g) || [];
        hashtags.forEach(tag => {
            hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
        });
    });

    return Object.entries(hashtagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
};

const computeCaptionLengthStats = (posts) => {
    const captions = posts.map(p => p.caption || '');
    const avgLength = captions.reduce((sum, cap) => sum + cap.length, 0) / captions.length;
    const longCaptions = captions.filter(cap => cap.length > 100).length;
    
    return {
        averageLength: Math.round(avgLength),
        longCaptionsPercentage: ((longCaptions / captions.length) * 100).toFixed(1) + '%'
    };
};

const estimateActiveFollowers = (profile, posts) => {
    const followerCount = profile.followers_count || 1;
    const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.video_views || 0), 0);
    
    return Math.min(100, ((totalLikes + totalViews) / (followerCount * posts.length) * 100)).toFixed(1) + '%';
};

const computeAllMetrics = (profile, posts) => {
    const { averageLikesPerFollower, averageCommentsPerFollower } = computeAverageLikesAndComments(profile, posts);
    const topPosts = getTopPosts(posts);
    const hashtagAnalysis = analyzeHashtags(posts);
    const captionStats = computeCaptionLengthStats(posts);

    return {
        engagementRate: parseFloat(computeEngagementRate(profile, posts)),
        engagementByType: computeEngagementByContentType(profile, posts),
        averageLikesPerFollower: parseFloat(averageLikesPerFollower),
        averageCommentsPerFollower: parseFloat(averageCommentsPerFollower),
        followerFollowingRatio: parseFloat(computeFollowerFollowingRatio(profile)),
        postingFrequency: parseFloat(computePostingFrequency(posts)),
        bestPostingTime: computeBestPostingWindows(posts)[0]?.timeSlot,
        topPost: topPosts.topEngagement ? {
            likesComments: topPosts.topEngagement.totalEngagement,
            videoViews: topPosts.topEngagement.video_views
        } : null,
        topReel: topPosts.topViews ? {
            likesComments: (topPosts.topViews.like_count || 0) + (topPosts.topViews.comments_count || 0),
            videoViews: topPosts.topViews.video_views
        } : null,
        topHashtags: hashtagAnalysis.map(h => h.tag.slice(1)),
        captionStats: {
            averageLength: captionStats.averageLength,
            percentLongCaptions: parseFloat(captionStats.longCaptionsPercentage)
        },
        activeFollowerEstimate: parseFloat(estimateActiveFollowers(profile, posts))
    };
};

module.exports = {
    computeAllMetrics,
    computeEngagementRate,
    computeEngagementByContentType,
    computeAverageLikesAndComments,
    computeFollowerFollowingRatio,
    computePostingFrequency,
    computeBestPostingWindows,
    getTopPosts,
    analyzeHashtags,
    computeCaptionLengthStats,
    estimateActiveFollowers
};