import { collection } from '../utils/mongo';
import { Maps } from '../types';

export default function Champs() {
  const Champs = collection<Champ>('champs');
  Champs.createIndex({
    champId: 1
  });
  return Champs;
}

export function findChamp(champId: number, mapId) {
  return Champs().findOne(
    {
      champId
    },
    {
      projection: {
        [`maps.${mapId}`]: true
      }
    }
  );
}

export function updateChamp(champId: number, mapId: number, map: ChampMapStats) {
  return Champs().updateOne(
    {
      champId
    },
    {
      $set: {
        [`maps.${mapId}`]: map
      }
    },
    {
      upsert: true
    }
  );
}

export interface Champ {
  _id?: string;
  champId: number;
  maps: {
    [mapId: string]: ChampMapStats;
  };
}

export interface ChampMapStats {
  stats: ChampStats & {
    mapId: Maps;
    banRate?: number;
    pickRate?: number;
  };
  positions: {
    [position: string]: {
      stats: ChampStats;
      spells: {
        [spellIds: string]: ChampStats & {
          spell1Id: number;
          spell2Id: number;
        };
      };
      items: {
        '2-12': {
          stats: ChampStats;
          items: {
            [itemId: string]: ChampStats & {
              itemId: number;
            };
          };
        };
        '12-22': {
          stats: ChampStats;
          items: {
            [itemId: string]: ChampStats & {
              itemId: number;
            };
          };
        };
        '22-32': {
          stats: ChampStats;
          items: {
            [itemId: string]: ChampStats & {
              itemId: number;
            };
          };
        };
        '32-42': {
          stats: ChampStats;
          items: {
            [itemId: string]: ChampStats & {
              itemId: number;
            };
          };
        };
        '42-52': {
          stats: ChampStats;
          items: {
            [itemId: string]: ChampStats & {
              itemId: number;
            };
          };
        };
      };
      firstItems: {
        [itemIds: string]: ChampStats & {
          items: [number];
        };
      };
      perks: {
        [perkIds: string]: ChampStats & {
          perk0: number;
          perk1: number;
          perk2: number;
          perk3: number;
          perk4: number;
          perk5: number;
        };
      };
      averageStats: ChampAverageStats;
      skillOrder: {
        [skillIds: string]: ChampStats & {
          order: [number];
        };
      };
    };
  };
}

export interface ChampAverageStats {
  totalDamageDealt: number;
  trueDamageDealt: number;
  magicDamageDealt: number;
  physicalDamageDealt: number;
  kills: number;
  deaths: number;
  assists: number;
  snowballKills: number;
  firstBloodKills: number;
}

export interface ChampStats {
  createdAt: Date;
  matches: number;
  winRate: number;
  lastPlayedAt: Date;
}
