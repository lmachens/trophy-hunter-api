import { collection } from '../utils/mongo';
import { Maps } from '../types';

export default function Champs() {
  const Champs = collection<Champ>('champs');
  Champs.createIndex({
    champId: 1
  });
  return Champs;
}

export function findChamp(championId: number) {
  return Champs().findOne({
    championId
  });
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
          [itemId: string]: ChampStats & {
            itemId: number;
          };
        };
        '12-22': {
          [itemId: string]: ChampStats & {
            itemId: number;
          };
        };
        '22-32': {
          [itemId: string]: ChampStats & {
            itemId: number;
          };
        };
        '32-42': {
          [itemId: string]: ChampStats & {
            itemId: number;
          };
        };
        '42-52': {
          [itemId: string]: ChampStats & {
            itemId: number;
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
      damageComposition: {
        total: number;
        totalTrue: number;
        totalMagical: number;
        totalPhysical: number;
      };
      skillOrder: {
        [skillIds: string]: ChampStats & {
          order: [number];
        };
      };
    };
  };
}

export interface ChampStats {
  createdAt: Date;
  matches: number;
  winRate: number;
  lastPlayedAt: Date;
}
