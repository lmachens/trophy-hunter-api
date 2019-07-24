import Champs, { Champ, ChampStats } from '../models/Champs';
import { Request, Response } from 'express';

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
      spells: {
        mostPlayed: findMostPlayed(value.spells),
        higestWinRate: findHighestWinRate(value.spells)
      },
      items: {
        '2-12': {
          mostPlayed: findMostPlayed(value.items['2-12']),
          higestWinRate: findHighestWinRate(value.items['2-12'])
        },
        '12-22': {
          mostPlayed: findMostPlayed(value.items['12-22']),
          higestWinRate: findHighestWinRate(value.items['12-22'])
        },
        '22-32': {
          mostPlayed: findMostPlayed(value.items['22-32']),
          higestWinRate: findHighestWinRate(value.items['22-32'])
        },
        '32-42': {
          mostPlayed: findMostPlayed(value.items['32-42']),
          higestWinRate: findHighestWinRate(value.items['32-42'])
        },
        '42-52': {
          mostPlayed: findMostPlayed(value.items['42-52']),
          higestWinRate: findHighestWinRate(value.items['42-52'])
        }
      },
      firstItems: {
        mostPlayed: findMostPlayed(value.firstItems),
        higestWinRate: findHighestWinRate(value.firstItems)
      },
      perks: {
        mostPlayed: findMostPlayed(value.perks),
        higestWinRate: findHighestWinRate(value.perks)
      },
      skillOrder: {
        mostPlayed: findMostPlayed(value.skillOrder),
        higestWinRate: findHighestWinRate(value.skillOrder)
      },
      damageComposition: value.damageComposition
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

function sortMostPlayed(a: ChampStats, b: ChampStats) {
  return a.matches - b.matches;
}

function findMostPlayed(obj: ChampStatsObj) {
  return omitDates(Object.values(obj).sort(sortMostPlayed)[0]);
}

function sortHighestWinRate(a: ChampStats, b: ChampStats) {
  return a.winRate - b.winRate;
}

function findHighestWinRate(obj: ChampStatsObj) {
  return omitDates(Object.values(obj).sort(sortHighestWinRate)[0]);
}

function omitDates(obj?: ChampStats) {
  if (!obj) {
    return null;
  }
  const { createdAt, lastPlayedAt, ...other } = obj;
  return other;
}
