// Types for follower growth analysis
export interface FollowerDataPoint {
  timestamp: string;
  followersCount: number;
}

export interface GrowthMetrics {
  netGrowth: number;
  growthRate: number;      // percent
  dailyAverage: number;    // followers per day
  weeklyAverage: number;
  monthlyAverage: number;
  projectedFollowers: number;
}

export function analyzeFollowerGrowth(
  history: FollowerDataPoint[]
): GrowthMetrics {
  if (!history || history.length < 2) {
    return {
      netGrowth: 0,
      growthRate: 0,
      dailyAverage: 0,
      weeklyAverage: 0,
      monthlyAverage: 0,
      projectedFollowers: history?.[0]?.followersCount || 0,
    };
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const first = sorted[0],
        last  = sorted[sorted.length - 1];
  const totalDays =
    (new Date(last.timestamp).getTime() - new Date(first.timestamp).getTime()) /
    (1000 * 60 * 60 * 24);

  const netGrowth = last.followersCount - first.followersCount;
  const growthRate =
    first.followersCount > 0 ? (netGrowth / first.followersCount) * 100 : 0;
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

export function calculateGrowthVelocity(history: FollowerDataPoint[]): number[] {
  if (history.length < 2) return [];

  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const velocities: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1],
          curr = sorted[i];
    const daysDiff =
      (new Date(curr.timestamp).getTime() -
        new Date(prev.timestamp).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysDiff > 0) {
      velocities.push((curr.followersCount - prev.followersCount) / daysDiff);
    }
  }

  return velocities;
}

export function getFollowerMilestones(current: number): number[] {
  const milestones: number[] = [];
  let next = 100;
  while (milestones.length < 5) {
    if (next > current) milestones.push(next);
    if (next < 1_000) next += 100;
    else if (next < 10_000) next += 1_000;
    else if (next < 100_000) next += 10_000;
    else next += 100_000;
  }
  return milestones;
}
