const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../databases/follower_history.json');

// Ensure the database file exists
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}));
}

const saveFollowerCount = async (username, followersCount) => {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const timestamp = new Date().toISOString();

    if (!db[username]) {
        db[username] = [];
    }

    db[username].push({ timestamp, followersCount });

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

const getFollowerHistory = async (username) => {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    return db[username] || [];
};

module.exports = { saveFollowerCount, getFollowerHistory };
