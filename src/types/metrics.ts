import { Post } from '../types';

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

export interface EnhancedMetrics {
  engagementRate: number;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  followerFollowingRatio: number;
  postingFrequency: number;
  postingWindows: Record<string, PostingWindow>;
  hashtagStats: HashtagStat[];
  captionStats: CaptionStats;
  postTypePerformance: PostTypeStats[];
  topPosts: {
    topEngagement: Post & { totalEngagement: number } | null;
    topViews: Post | null;
  };
}
