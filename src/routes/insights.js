// backend/src/routes/insights.js
const express = require('express');
const axios = require('axios');
const { computeAllMetrics } = require('../utils/metrics');
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
        const media = profile.media?.data || [];

        // Compute all metrics
        const metrics = computeAllMetrics(profile, media);
        const recentMedia = media.slice(0, 10);

        // Save follower count with timestamp
        await saveFollowerCount(profile.username, profile.followers_count);

        res.json({
            profile: {
                username: profile.username,
                name: profile.name,
                biography: profile.biography,
                website: profile.website,
                profile_picture_url: profile.profile_picture_url,
                followers_count: profile.followers_count,
                follows_count: profile.follows_count,
                media_count: profile.media_count,
                category: profile.category
            },
            metrics,
            recentMedia
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