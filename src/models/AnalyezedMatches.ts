import { collection } from '../utils/mongo';
import { Maps } from '../types';

export default () => {
  const AnalyezedMatches = collection<AnalyezedMatch | null>('analyzed_matches');
  AnalyezedMatches.createIndex({
    gameId: 1,
    platformId: 1
  });
  AnalyezedMatches.createIndex({
    mapId: 1
  });
  return AnalyezedMatches;
};

export interface AnalyezedMatch {
  gameId: number;
  mapId: Maps;
  platformId: string;
  analyzedAt: Date;
}
