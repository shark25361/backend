// To fix TS2550 errors, ensure your tsconfig.json includes "lib": ["es2017", "dom"] or later.
import { Post, Profile } from '../types';
import {
  PostingWindow,
  HashtagStat,
  CaptionStats,
  PostTypeStats,
  MetricsResult,
} from '../types';

export function computeAllMetrics(
  profile: Profile,
  posts: Post[]
): MetricsResult & { bestPostingWindow: { slot: string; avgEngagement: number } | null } {
  const followerCount = profile.followers_count || 1;
  const followingCount = profile.follows_count || 1;

  // Totals
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
  const totalEngagement = totalLikes + totalComments;
  const avgLikesPerPost = totalLikes / (posts.length || 1);
  const avgCommentsPerPost = totalComments / (posts.length || 1);
  const engagementRate =
    ((totalEngagement / (posts.length || 1)) / followerCount) * 100;

  // Posting frequency (days)
  const dates = posts
    .map((p) => new Date(p.timestamp))
    .sort((a, b) => b.getTime() - a.getTime());
  const postingFrequency =
    dates.length > 1
      ? dates
          .slice(0, -1)
          .reduce(
            (sum, d, i) =>
              sum +
              (d.getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24),
            0
          ) /
        (dates.length - 1)
      : 0;

  // Best posting windows (with average engagement)
  const windowMap: Record<string, PostingWindow & { avgEngagement?: number }> = {};
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
    if (!windowMap[slot]) windowMap[slot] = { posts: 0, engagement: 0 };
    windowMap[slot].posts++;
    windowMap[slot].engagement += p.like_count + p.comments_count;
  });

  // Calculate average engagement per slot
  let bestPostingWindow: { slot: string; avgEngagement: number } | null = null;
  Object.entries(windowMap).forEach(([slot, data]) => {
    const avg = data.posts > 0 ? data.engagement / data.posts : 0;
    windowMap[slot].avgEngagement = avg;
    if (!bestPostingWindow || avg > bestPostingWindow.avgEngagement) {
      bestPostingWindow = { slot, avgEngagement: avg };
    }
  });

  const postingWindows = windowMap;

  // Hashtag stats
  const hashMap: Record<string, HashtagStat> = {};
  const hashRx = /#([A-Za-z0-9_]+)/g;
  posts.forEach((p) => {
    const tags = p.caption?.match(hashRx) ?? [];
    const eng = p.like_count + p.comments_count;
    tags.forEach((t) => {
      const tag = t.slice(1);
      if (!hashMap[tag]) hashMap[tag] = { tag, count: 0, engagement: 0 };
      hashMap[tag].count++;
      hashMap[tag].engagement += eng;
    });
  });
  const hashtagStats = Object.values(hashMap).sort(
    (a: HashtagStat, b: HashtagStat) => b.engagement / b.count - a.engagement / a.count
  );

  // Caption stats
  const lengths = posts.map((p) => p.caption?.length ?? 0);
  const averageLength =
    lengths.reduce((s, l) => s + l, 0) / (posts.length || 1);
  const percentLongCaptions =
    posts.filter((p) => (p.caption?.length ?? 0) > 200).length /
    (posts.length || 1);
  const captionStats: CaptionStats = {
    averageLength,
    percentLongCaptions,
  };

  // Post type performance
  const typeMap: Record<string, PostTypeStats> = {};
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
  const postTypePerformance = Object.values(typeMap).map((t: PostTypeStats) => ({
    type: t.type,
    avgEngagement: t.avgEngagement / t.count,
    avgViews: t.avgViews / t.count,
    count: t.count,
  }));

  // Top posts last 30 days
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = posts.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
  const topEngagement = recent
    .slice()
    .sort(
      (a: Post, b: Post) =>
        b.like_count +
        b.comments_count -
        (a.like_count + a.comments_count)
    )[0] ?? null;
  const topViews =
    recent
      .filter((p) => p.video_views)
      .sort((a: Post, b: Post) => (b.video_views ?? 0) - (a.video_views ?? 0))[0] ??
    null;

  // Detailed metrics
  const avgDays = postingFrequency.toFixed(1);
  const consistency =
    postingFrequency < 3 ? 'High' : postingFrequency < 7 ? 'Medium' : 'Low';
  const likesWeight = ((totalLikes / totalEngagement) * 100).toFixed(1) + '%';
  const commentsWeight =
    ((totalComments / totalEngagement) * 100).toFixed(1) + '%';

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
      topEngagement:
        topEngagement &&
        ({
          ...topEngagement,
          totalEngagement: topEngagement.like_count + topEngagement.comments_count,
        } as Post & { totalEngagement: number }),
      topViews,
    },
    detailedMetrics: {
      postingFrequency: { avgDays, consistency },
      engagementQuality: { likesWeight, commentsWeight },
    },
    bestPostingWindow,
  };
}
