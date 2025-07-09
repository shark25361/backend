"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeFollowerGrowth = analyzeFollowerGrowth;
exports.calculateGrowthVelocity = calculateGrowthVelocity;
exports.getFollowerMilestones = getFollowerMilestones;
function analyzeFollowerGrowth(history) {
    var _a;
    if (!history || history.length < 2) {
        return {
            netGrowth: 0,
            growthRate: 0,
            dailyAverage: 0,
            weeklyAverage: 0,
            monthlyAverage: 0,
            projectedFollowers: ((_a = history === null || history === void 0 ? void 0 : history[0]) === null || _a === void 0 ? void 0 : _a.followersCount) || 0,
        };
    }
    const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const first = sorted[0], last = sorted[sorted.length - 1];
    const totalDays = (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) /
        (1000 * 60 * 60 * 24);
    const netGrowth = last.followersCount - first.followersCount;
    const growthRate = first.followersCount > 0 ? (netGrowth / first.followersCount) * 100 : 0;
    const dailyAverage = totalDays > 0 ? netGrowth / totalDays : 0;
    const weeklyAverage = dailyAverage * 7;
    const monthlyAverage = dailyAverage * 30;
    const projectedFollowers = Math.round(last.followersCount + dailyAverage * 30);
    return {
        netGrowth,
        growthRate,
        dailyAverage,
        weeklyAverage,
        monthlyAverage,
        projectedFollowers,
    };
}
function calculateGrowthVelocity(history) {
    if (history.length < 2)
        return [];
    const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const velocities = [];
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1], curr = sorted[i];
        const daysDiff = (new Date(curr.timestamp).getTime() -
            new Date(prev.timestamp).getTime()) /
            (1000 * 60 * 60 * 24);
        if (daysDiff > 0) {
            velocities.push((curr.followersCount - prev.followersCount) / daysDiff);
        }
    }
    return velocities;
}
function getFollowerMilestones(current) {
    const milestones = [];
    let next = 100;
    while (milestones.length < 5) {
        if (next > current)
            milestones.push(next);
        if (next < 1000)
            next += 100;
        else if (next < 10000)
            next += 1000;
        else if (next < 100000)
            next += 10000;
        else
            next += 100000;
    }
    return milestones;
}
