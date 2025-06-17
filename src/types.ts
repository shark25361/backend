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

export interface Metrics {
  overallEngagementRate: string;
  averageLikesPerFollower: string;
  followerFollowingRatio: string;
  averagePostingFrequency: string;
  bestPostingWindows: Array<{
    timeSlot: string;
    avgEngagement: number;
  }>;
  topPosts: {
    topEngagement: Post & { totalEngagement: number } | null;
    topViews: Post | null;
  };
  hashtagAnalysis: Array<{
    tag: string;
    count: number;
  }>;
  captionStats: {
    averageLength: number;
    longCaptionsPercentage: string;
  };
  activeFollowerEstimate: string;
  engagementByType: Record<string, string>;
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
