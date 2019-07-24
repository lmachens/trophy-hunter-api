import { collection } from '../utils/mongo';

export default () => {
  const Matchups = collection<Matchup | null>('matchups');
  Matchups.createIndex({
    champ1Id: 1,
    champ2Id: 2,
    position: 1
  });
  return Matchups;
};

export interface Matchup {
  championId1: number;
  championId2: number;
  maps: {
    [mapId: string]: {
      matches: number;
      champion1: ChampionMatchupStats;
      champion2: ChampionMatchupStats;
    };
  };
}

export interface ChampionMatchupStats {
  kills: number;
  deaths: number;
  assists: number;
  winRate: number;
}
