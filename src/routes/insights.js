// backend/src/routes/insights.js
const express = require('express');
const axios = require('axios');
const { computeAllMetrics } = require('../utils/metrics');
const { analyzeFollowerGrowth, calculateGrowthVelocity, getFollowerMilestones } = require('../utils/growth');
const { saveFollowerCount, getFollowerHistory } = require('../utils/database');

const router = express.Router();

router.get('/api/insights', async (req, res) => {
    const { username } = req.query;
    const ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;
    const OUR_IG_ID = process.env.IG_BUSINESS_ID;

    // Validate environment variables
    if (!ACCESS_TOKEN || !OUR_IG_ID) {
        return res.status(500).json({ 
            error: 'Missing Instagram API credentials. Please check environment variables.' 
        });
    }

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const cleanUsername = username.replace(/^@/, '');
        const fields = encodeURIComponent(`business_discovery.username(${cleanUsername}){
            username,
            id,
            name,
            profile_picture_url,
            biography,
            website,
            followers_count,
            follows_count,
            media_count,
            media.limit(25){
                id,
                media_type,
                media_url,
                thumbnail_url,
                permalink,
                timestamp,
                caption,
                like_count,
                comments_count,
                video_views,
                children{
                    media_type,
                    media_url,
                    thumbnail_url
                }
            }
        }`);

        const url = `https://graph.facebook.com/v19.0/${OUR_IG_ID}?fields=${fields}&access_token=${ACCESS_TOKEN}`;
        
        console.log('Making request to:', url);
        
        const response = await axios.get(url);
        
        console.log('API Response:', JSON.stringify(response.data, null, 2));
        
        if (!response.data || !response.data.business_discovery) {
            console.error('Invalid API response structure:', response.data);
            throw new Error('Invalid response from Instagram API');
        }

        const profile = {
            ...response.data.business_discovery,
            category: response.data.business_discovery.category || null,
        };
        const media = (profile.media?.data || []).slice(0, 10); // Limit to last 10 posts

        // Save follower count for historical tracking
        await saveFollowerCount(cleanUsername, profile.followers_count);

        // Get follower history and compute growth metrics
        const followerHistory = await getFollowerHistory(cleanUsername);
        const growthMetrics = analyzeFollowerGrowth(followerHistory);
        const growthVelocity = calculateGrowthVelocity(followerHistory);
        const nextMilestones = getFollowerMilestones(profile.followers_count);

        // Compute all metrics
        const metrics = computeAllMetrics(profile, media);

        // --- Compute follower % change over 7/30 days ---
        let percentChange7d = null, percentChange30d = null;
        if (followerHistory && followerHistory.length > 1) {
            const now = new Date();
            const getClosest = (daysAgo) => {
                const target = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
                return followerHistory.reduce((closest, point) => {
                    const d = new Date(point.timestamp);
                    return (!closest || Math.abs(d - target) < Math.abs(new Date(closest.timestamp) - target)) ? point : closest;
                }, null);
            };
            const last = followerHistory[followerHistory.length - 1];
            const ago7 = getClosest(7);
            const ago30 = getClosest(30);
            if (ago7 && ago7.followersCount > 0) {
                percentChange7d = ((last.followersCount - ago7.followersCount) / ago7.followersCount) * 100;
            }
            if (ago30 && ago30.followersCount > 0) {
                percentChange30d = ((last.followersCount - ago30.followersCount) / ago30.followersCount) * 100;
            }
        }

        // --- Compute active follower estimate ---
        let avgLikes = 0, avgViews = 0;
        if (media.length > 0) {
            avgLikes = media.reduce((sum, p) => sum + (p.like_count || 0), 0) / media.length;
            const reelsOrVideos = media.filter(p => p.media_type === 'REELS_VIDEO' || p.media_type === 'VIDEO');
            if (reelsOrVideos.length > 0) {
                avgViews = reelsOrVideos.reduce((sum, p) => sum + (p.video_views || 0), 0) / reelsOrVideos.length;
            }
        }
        const activeFollowerEstimate = profile.followers_count ? (avgViews > 0 ? avgViews : avgLikes) / profile.followers_count : null;

        // --- Hashtag and caption stats adjustments ---
        // Top 3-5 hashtags by frequency
        let topHashtags = [];
        if (metrics.hashtagStats && metrics.hashtagStats.length > 0) {
            topHashtags = metrics.hashtagStats
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
        }
        // Percent of captions > 100 chars
        let percentLongCaptions100 = 0;
        if (media.length > 0) {
            percentLongCaptions100 = media.filter(p => (p.caption?.length || 0) > 100).length / media.length;
        }

        // Return combined data
        res.json({
            profile: {
                username: profile.username || null,
                id: profile.id || null,
                name: profile.name || null,
                profile_picture_url: profile.profile_picture_url || null,
                biography: profile.biography || null,
                website: profile.website || null,
                followers_count: profile.followers_count || null,
                following_count: profile.follows_count || null,
                media_count: profile.media_count || null,
                category: profile.category || null
            },
            metrics: {
                ...metrics,
                hashtagStats: topHashtags,
                captionStats: {
                    ...metrics.captionStats,
                    percentLongCaptions100
                },
                activeFollowerEstimate,
                growth: {
                    ...growthMetrics,
                    velocity: growthVelocity,
                    nextMilestones,
                    percentChange7d,
                    percentChange30d
                },
                followerHistory,
                bestPostingWindow: metrics.bestPostingWindow
            },
            recentMedia: media.map(post => ({
                id: post.id || null,
                media_type: post.media_type || null,
                media_url: post.media_url || null,
                thumbnail_url: post.thumbnail_url || null,
                permalink: post.permalink || null,
                timestamp: post.timestamp || null,
                caption: post.caption || null,
                like_count: post.like_count || null,
                comments_count: post.comments_count || null,
                video_views: post.video_views || null
            }))
        });

    } catch (err) {
        console.error('Instagram API Error:', err.response?.data || err.message);
        res.status(500).json({ 
            error: 'Failed to fetch data from Instagram API',
            details: err.response?.data?.error?.message || err.message
        });
    }
});

// New endpoint to fetch follower history
router.get('/api/follower-history', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const history = await getFollowerHistory(username);
        res.json({ success: true, history });
    } catch (err) {
        console.error('Error fetching follower history:', err.message);
        res.status(500).json({ error: 'Failed to fetch follower history' });
    }
});

module.exports = router;