import { collection } from '../utils/mongo';
import { Maps } from '../types';

export default function AnalyzedMatches() {
  const AnalyzedMatches = collection<AnalyezedMatch>('analyzed_matches');
  AnalyzedMatches.createIndex({
    gameId: 1,
    platformId: 1
  });
  AnalyzedMatches.createIndex({
    mapId: 1
  });
  return AnalyzedMatches;
}

export interface AnalyezedMatch {
  gameId: number;
  mapId: Maps;
  platformId: string;
  analyzedAt: Date;
}

export async function hasAnalyzedMatch(platformId: string, gameId: number) {
  return !!(await AnalyzedMatches().findOne({ gameId, platformId }));
}

export function countMatches(mapId: Maps) {
  return AnalyzedMatches()
    .find({ mapId })
    .count();
}

export function insertAnalyzedMatch(analzedMatch: AnalyezedMatch) {
  return AnalyzedMatches().insertOne(analzedMatch);
}
