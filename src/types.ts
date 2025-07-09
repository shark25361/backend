export interface Profile {
  username: string;
  id: string;
  name: string;
  profile_picture_url: string;
  biography: string;
  website: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  category?: string;
}

export interface Post {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS_VIDEO';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  like_count: number;
  comments_count: number;
  video_views?: number;
}

export interface PostingWindow {
  posts: number;
  engagement: number;
}

export interface HashtagStat {
  tag: string;
  count: number;
  engagement: number;
}

export interface CaptionStats {
  averageLength: number;
  percentLongCaptions: number;
}

export interface PostTypeStats {
  type: string;
  avgEngagement: number;
  avgViews: number;
  count: number;
}

export interface MetricsResult {
  engagementRate: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  followerFollowingRatio: number;
  postingFrequency: number;                           // days between posts
  postingWindows: Record<string, PostingWindow>;
  hashtagStats: HashtagStat[];
  captionStats: CaptionStats;
  postTypePerformance: PostTypeStats[];
  topPosts: {
    topEngagement: Post & { totalEngagement: number } | null;
    topViews: Post | null;
  };
  detailedMetrics: {
    postingFrequency: {
      avgDays: string;
      consistency: 'High' | 'Medium' | 'Low';
    };
    engagementQuality: {
      likesWeight: string;
      commentsWeight: string;
    };
  };
}
