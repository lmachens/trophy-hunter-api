import Champs, { findChamp, updateChamp, ChampMapStats } from '../models/champs';
import { hasAnalyzedMatch, countMatches, insertAnalyzedMatch } from '../models/AnalyzedMatches';
import getPosition from '../utils/getPosition';
import createId from '../utils/createId';
import getSkillOrder from '../utils/getSkillOrder';
import getItemsPurchased from '../utils/getItemsPurchased';
import updateMatchupStats from '../utils/updateMatchupStats';
import { createMatch } from '../models/Match';
import { Request, Response } from 'express';

function createStats({ data, existingStats, now, win }) {
  const stats = {
    createdAt: now,
    matches: 0,
    winRate: 0,
    ...data,
    ...existingStats,
    lastPlayedAt: now
  };
  stats.winRate = (stats.matches * stats.winRate + win) / (stats.matches + 1);
  stats.matches++;
  return stats;
}

function createDamageComposition({
  totalDamageDealt,
  magicDamageDealt,
  physicalDamageDealt,
  trueDamageDealt,
  existingDamageComposition,
  matches
}) {
  return {
    total: ((matches - 1) * existingDamageComposition.total + totalDamageDealt) / matches,
    totalTrue: ((matches - 1) * existingDamageComposition.totalTrue + trueDamageDealt) / matches,
    totalMagical:
      ((matches - 1) * existingDamageComposition.totalMagical + magicDamageDealt) / matches,
    totalPhysical:
      ((matches - 1) * existingDamageComposition.totalPhysical + physicalDamageDealt) / matches
  };
}

function createPositionStats({ participant, existingStats = {}, now, win, timeline }) {
  const {
    totalDamageDealt,
    magicDamageDealt,
    physicalDamageDealt,
    trueDamageDealt
  } = participant.stats;

  const positionStats = {
    stats: {
      matches: 0
    },
    spells: {},
    items: {
      '2-12': {},
      '12-22': {},
      '22-32': {},
      '32-42': {},
      '42-52': {}
    },
    firstItems: {},
    perks: {},
    skillOrder: {},
    damageComposition: {
      totalTrue: trueDamageDealt,
      totalMagical: magicDamageDealt,
      total: totalDamageDealt,
      totalPhysical: physicalDamageDealt
    },
    ...existingStats
  };

  positionStats.stats = createStats({
    data: {},
    existingStats: positionStats.stats || {},
    now,
    win
  });

  positionStats.damageComposition = createDamageComposition({
    totalDamageDealt,
    magicDamageDealt,
    physicalDamageDealt,
    trueDamageDealt,
    existingDamageComposition: positionStats.damageComposition,
    matches: positionStats.stats.matches
  });

  const { spell1Id, spell2Id } = participant;
  const spells = { spell1Id, spell2Id };
  const spellsId = createId(spells);
  positionStats.spells[spellsId] = createStats({
    data: spells,
    existingStats: positionStats.spells[spellsId],
    now,
    win
  });

  const { perk0, perk1, perk2, perk3, perk4, perk5 } = participant.stats;
  const perks = { perk0, perk1, perk2, perk3, perk4, perk5 };
  const perkIds = createId(perks);
  positionStats.perks[perkIds] = createStats({
    data: perks,
    existingStats: positionStats.perks[perkIds],
    now,
    win
  });

  const skillOrder = getSkillOrder({ timeline, participantId: participant.participantId });
  if (skillOrder.length === 18) {
    const skillOrderId = skillOrder.join('-');
    positionStats.skillOrder[skillOrderId] = createStats({
      data: {
        order: skillOrder
      },
      existingStats: positionStats.skillOrder[skillOrderId],
      now,
      win
    });
  }

  for (let i = 0; i < 5; i++) {
    const from = 2 + i * 10;
    const items = getItemsPurchased({
      timeline,
      participantId: participant.participantId,
      from,
      minutes: 10
    });
    if (items.length > 0) {
      items.forEach(itemId => {
        positionStats.items[`${from}-${from + 10}`][itemId] = createStats({
          data: {
            itemId
          },
          existingStats: positionStats.items[`${from}-${from + 10}`][itemId],
          now,
          win
        });
      });
    }
  }

  const firstItems = getItemsPurchased({
    timeline,
    participantId: participant.participantId,
    from: 1,
    minutes: 1
  });
  if (firstItems.length > 0) {
    const firstItemsId = firstItems.join('-');
    positionStats.firstItems[firstItemsId] = createStats({
      data: {
        items: firstItems
      },
      existingStats: positionStats.firstItems[firstItemsId],
      now,
      win
    });
  }

  return positionStats;
}

export async function postMatch(req: Request, res: Response) {
  const platformId = req.query.platformId && req.query.platformId.trim().toUpperCase();
  const matchId = parseInt(req.query.matchId);
  if (isNaN(matchId) || typeof platformId !== 'string') {
    return res.status(403).end('Invalid matchId or platformId');
  }

  try {
    if (await hasAnalyzedMatch(platformId, matchId)) {
      return res.status(400).end('Already analyzed');
    }

    const match = await createMatch(platformId, matchId);

    const now = new Date();
    match.participants.forEach(async participant => {
      try {
        const champ = await findChamp(participant.championId);

        const { mapId } = match;
        const maps = (champ && champ.maps) || {};
        const win = participant.stats.win ? 1 : 0;

        const existingMap = maps[mapId] || {
          stats: {},
          positions: {}
        };
        const { role, lane } = participant.timeline;
        const positionId = getPosition(role, lane);

        const map = {
          stats: createStats({
            data: { mapId },
            existingStats: existingMap.stats,
            now,
            win
          }),
          positions: {
            ...existingMap.positions,
            [positionId]: createPositionStats({
              participant,
              now,
              win,
              existingStats: existingMap.positions[positionId],
              timeline: match.timeline
            })
          }
        } as ChampMapStats;

        await updateChamp(participant.championId, mapId, map);
      } catch (error) {
        console.log(error);
      }
    });

    const { banIds, champIds, mapId } = match;
    const matchesCount = await countMatches(mapId);

    await Champs()
      .find({
        [`maps.${match.mapId}`]: { $exists: true }
      })
      .forEach(async champ => {
        const picked = champIds.includes(champ.champId) ? 1 : 0;
        const banned = banIds.includes(champ.champId) ? 1 : 0;
        const map = champ.maps[match.mapId];
        const existingStats = map.stats;
        const pickRate =
          (matchesCount * (existingStats.pickRate || 0) + picked) / (matchesCount + 1);
        const banRate = (matchesCount * (existingStats.banRate || 0) + banned) / (matchesCount + 1);

        await Champs().updateOne(
          {
            championId: champ.champId
          },
          {
            $set: {
              [`maps.${match.mapId}.stats.pickRate`]: pickRate,
              [`maps.${match.mapId}.stats.banRate`]: banRate
            }
          }
        );
      });

    await insertAnalyzedMatch({
      gameId: match.gameId,
      mapId: match.mapId,
      platformId,
      analyzedAt: now
    });

    updateMatchupStats(match);
    res.end('Analyzed');
  } catch (error) {
    console.error(error);
    res.status(200).end('Error');
  }
}
