import { collection } from '../utils/mongo';

export default function Matchups() {
  const Matchups = collection<Matchup>('matchups');
  Matchups.createIndex({
    champ1Id: 1,
    champ2Id: 2,
    position: 1
  });
  return Matchups;
}

export function updateMatchup(
  champ1Id: number,
  champ2Id: number,
  mapId: number,
  mapStats: MatchupMap
) {
  return Matchups().updateOne(
    {
      champ1Id,
      champ2Id
    },
    {
      $set: {
        [`maps.${mapId}`]: mapStats
      }
    },
    {
      upsert: true
    }
  );
}

export interface Matchup {
  champ1Id: number;
  champ2Id: number;
  maps: {
    [mapId: string]: MatchupMap;
  };
}

export interface MatchupMap {
  matches: number;
  champ1: MatchupChampionStats;
  champ2: MatchupChampionStats;
}

export interface MatchupChampionStats {
  kills: number;
  deaths: number;
  assists: number;
  winRate: number;
}
