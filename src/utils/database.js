// In-memory storage for serverless environment
let db = {};

const saveFollowerCount = async (username, followersCount) => {
    const timestamp = new Date().toISOString();

    if (!db[username]) {
        db[username] = [];
    }

    db[username].push({ timestamp, followersCount });

    // Limit history to last 100 entries to manage memory
    if (db[username].length > 100) {
        db[username] = db[username].slice(-100);
    }
};

const getFollowerHistory = async (username) => {
    return db[username] || [];
};

module.exports = { saveFollowerCount, getFollowerHistory };
