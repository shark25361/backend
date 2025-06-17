import { Post, Profile } from '../types';

export function computeAllMetrics(profile: Profile, posts: Post[]) {
  const followerCount = profile.followers_count || 1;
  const followingCount = profile.follows_count || 1;

  // Calculate totals
  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.video_views || 0), 0);
  const totalEngagement = totalLikes + totalComments;

  // Posting frequency analysis
  const timestamps = posts.map(p => new Date(p.timestamp)).sort((a, b) => b - a);
  const avgDaysBetweenPosts = timestamps.length > 1 
    ? timestamps.slice(0, -1).reduce((sum, date, i) => 
        sum + (date - timestamps[i + 1]) / (1000 * 60 * 60 * 24), 0) / (timestamps.length - 1)
    : 0;

  // Best posting windows analysis
  const postingWindows: Record<string, { posts: number; engagement: number }> = {};
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  posts.forEach(post => {
    const date = new Date(post.timestamp);
    const dayName = daysOfWeek[date.getDay()];
    const hour = date.getHours();
    const timeSlot = `${dayName} ${hour}:00`;
    
    if (!postingWindows[timeSlot]) {
      postingWindows[timeSlot] = { posts: 0, engagement: 0 };
    }
    postingWindows[timeSlot].posts++;
    postingWindows[timeSlot].engagement += (post.like_count || 0) + (post.comments_count || 0);
  });

  // Calculate average engagement per time slot
  const bestPostingWindows = Object.entries(postingWindows)
    .map(([timeSlot, data]) => ({
      timeSlot,
      avgEngagement: data.engagement / data.posts
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 5);

  // Top posts analysis (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPosts = posts.filter(p => new Date(p.timestamp) >= thirtyDaysAgo);
  
  const topEngagementPost = [...recentPosts].sort((a, b) => 
    ((b.like_count || 0) + (b.comments_count || 0)) - 
    ((a.like_count || 0) + (a.comments_count || 0))
  )[0];

  const topViewedPost = [...recentPosts]
    .filter(p => p.video_views)
    .sort((a, b) => (b.video_views || 0) - (a.video_views || 0))[0];

  // Hashtag analysis
  const hashtagCounts: Record<string, number> = {};
  posts.forEach(post => {
    const hashtags = (post.caption || '').match(/#[\w\u0590-\u05ff]+/g) || [];
    hashtags.forEach(tag => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });

  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  // Caption analysis
  const captions = posts.map(p => p.caption || '');
  const avgCaptionLength = captions.reduce((sum, cap) => sum + cap.length, 0) / captions.length;
  const longCaptionsCount = captions.filter(cap => cap.length > 100).length;
  const longCaptionsPercentage = (longCaptionsCount / captions.length * 100);

  // Active follower estimate
  const activeFollowerEstimate = Math.min(100, ((totalLikes + totalViews) / (followerCount * posts.length) * 100));

  // Engagement by content type
  const byType = posts.reduce((acc, post) => {
    const type = post.media_type;
    if (!acc[type]) {
      acc[type] = { count: 0, likes: 0, comments: 0 };
    }
    acc[type].count++;
    acc[type].likes += post.like_count || 0;
    acc[type].comments += post.comments_count || 0;
    return acc;
  }, {} as Record<string, { count: number; likes: number; comments: number }>);

  return {
    overallEngagementRate: ((totalEngagement / followerCount) * 100).toFixed(1) + '%',
    averageLikesPerFollower: (totalLikes / followerCount).toFixed(3),
    followerFollowingRatio: (followerCount / followingCount).toFixed(1),
    averagePostingFrequency: avgDaysBetweenPosts.toFixed(1) + 'd',
    bestPostingWindows,
    topPosts: {
      topEngagement: topEngagementPost ? {
        ...topEngagementPost,
        totalEngagement: (topEngagementPost.like_count || 0) + (topEngagementPost.comments_count || 0)
      } : null,
      topViews: topViewedPost || null
    },
    hashtagAnalysis: topHashtags,
    captionStats: {
      averageLength: Math.round(avgCaptionLength),
      longCaptionsPercentage: longCaptionsPercentage.toFixed(1) + '%'
    },
    activeFollowerEstimate: activeFollowerEstimate.toFixed(1) + '%',
    engagementByType: Object.entries(byType).reduce((acc, [type, data]) => ({
      ...acc,
      [type]: ((data.likes + data.comments) / followerCount * 100).toFixed(1) + '%'
    }), {} as Record<string, string>),
    detailedMetrics: {
      postingFrequency: {
        avgDays: avgDaysBetweenPosts.toFixed(1),
        consistency: avgDaysBetweenPosts < 3 ? 'High' : avgDaysBetweenPosts < 7 ? 'Medium' : 'Low'
      },
      engagementQuality: {
        likesWeight: (totalLikes / totalEngagement * 100).toFixed(1) + '%',
        commentsWeight: (totalComments / totalEngagement * 100).toFixed(1) + '%'
      }
    }
  };
}
