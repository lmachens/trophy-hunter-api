import { collection } from '../utils/mongo';
import { Maps } from '../types';

export default () => {
  const Champs = collection<Champ | null>('champs');
  Champs.createIndex({
    championId: 1
  });
  return Champs;
};

export interface Champ {
  championId: number;
  maps: {
    [mapId: string]: {
      stats: {
        createdAt: Date;
        matches: number;
        winRate: number;
        mapId: Maps;
        lastPlayedAt: Date;
        banRate: number;
        pickRate: number;
      };
      positions: {
        [position: string]: {
          stats: {
            createdAt: Date;
            matches: number;
            winRate: number;
            lastPlayedAt: Date;
          };
          spells: {
            [spellIds: string]: {
              createdAt: Date;
              matches: number;
              winRate: number;
              spell1Id: number;
              spell2Id: number;
              lastPlayedAt: Date;
            };
          };
          items: {
            [framesRange: string]: {
              [itemId: string]: {
                createdAt: Date;
                matches: number;
                winRate: number;
                itemId: number;
                lastPlayedAt: Date;
              };
            };
          };
          firstItems: {
            [itemIds: string]: {
              createdAt: Date;
              matches: number;
              winRate: number;
              items: [number];
              lastPlayedAt: Date;
            };
          };
          perks: {
            [perkIds: string]: {
              createdAt: Date;
              matches: number;
              winRate: number;
              perk0: number;
              perk1: number;
              perk2: number;
              perk3: number;
              perk4: number;
              perk5: number;
              lastPlayedAt: Date;
            };
          };
          damageComposition: {
            total: number;
            totalTrue: number;
            totalMagical: number;
            totalPhysical: number;
          };
          skillOrder: {
            [skillIds: string]: {
              createdAt: Date;
              matches: number;
              winRate: number;
              order: [number];
              lastPlayedAt: Date;
            };
          };
        };
      };
    };
  };
}
