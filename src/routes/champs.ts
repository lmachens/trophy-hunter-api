import Champs, { Champ, ChampStats } from '../models/Champs';
import { Request, Response } from 'express';
import { sortWinRate } from '../utils/sort';

export async function getChamp(req: Request, res: Response) {
  res.set('Cache-Control', 'public, max-age=86400');
  const champId = parseInt(req.query.champId);
  const mapId = parseInt(req.query.mapId);

  if (isNaN(mapId) || isNaN(champId)) {
    return res.status(403).end('Invalid mapId or champId');
  }

  const champ = await Champs().findOne(
    { champId, [`maps.${mapId}`]: { $exists: true } },
    {
      projection: {
        _id: false,
        champId: true,
        [`maps.${mapId}`]: true
      }
    }
  );

  if (!champ) {
    return res.status(404).end('Not found');
  }

  const filteredChamp = filterChamp(champ);
  res.json(filteredChamp);
}

function filterChamp(champ: Champ) {
  const [mapId, map] = Object.entries(champ.maps)[0];
  const positions = Object.entries(map.positions).reduce((positions, [key, value]) => {
    const position = {
      ...omitDates(value.stats),
      spells: filterTop(value.spells, value.stats.matches, 2),
      items: {
        '2-12': filterTop(value.items['2-12'].items, value.items['2-12'].stats.matches, 5),
        '12-22': filterTop(value.items['12-22'].items, value.items['12-22'].stats.matches, 5),
        '22-32': filterTop(value.items['22-32'].items, value.items['22-32'].stats.matches, 5),
        '32-42': filterTop(value.items['32-42'].items, value.items['32-42'].stats.matches, 5),
        '42-52': filterTop(value.items['42-52'].items, value.items['42-52'].stats.matches, 5)
      },
      firstItems: filterTop(value.firstItems, value.stats.matches, 2),
      perks: filterTop(value.perks, value.stats.matches, 2),
      skillOrder: filterTop(value.skillOrder, value.stats.matches, 2),
      averageStats: value.averageStats
    };
    return {
      ...positions,
      [key]: position
    };
  }, {});

  return {
    champId: champ.champId,
    mapId: parseInt(mapId),
    matches: map.stats.matches,
    winRate: map.stats.winRate,
    positions
  };
}

interface ChampStatsObj {
  [key: string]: ChampStats;
}

function filterTop(obj: ChampStatsObj, matches: number, limit = 1, threshold = 0.1) {
  return Object.values(obj)
    .filter(stats => stats.matches / matches > threshold)
    .sort(sortWinRate)
    .slice(0, limit)
    .map(omitDates);
}

function omitDates(obj?: ChampStats) {
  if (!obj) {
    return null;
  }
  const { createdAt, lastPlayedAt, ...other } = obj;
  return other;
}
