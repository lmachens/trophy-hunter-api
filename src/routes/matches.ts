import Champs from '../models/champs';
import Matches from '../models/matches';
import thApi from '../utils/th-api';
import getPosition from '../utils/getPosition';
import createId from '../utils/createId';
import getSkillOrder from '../utils/getSkillOrder';
import getItemsPurchased from '../utils/getItemsPurchased';

function createStats({ data = {}, existingStats = {}, now, win }) {
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
  existingDamageComposition
}) {
  return {
    total: (existingDamageComposition.total + totalDamageDealt) / 2,
    totalTrue: (existingDamageComposition.totalTrue + trueDamageDealt) / 2,
    totalMagical: (existingDamageComposition.totalMagical + magicDamageDealt) / 2,
    totalPhysical: (existingDamageComposition.totalPhysical + physicalDamageDealt) / 2
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
    stats: {},
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
    damageComposition: {
      totalTrue: trueDamageDealt,
      totalMagical: magicDamageDealt,
      total: totalDamageDealt,
      totalPhysical: physicalDamageDealt
    },
    skillOrder: {},
    ...existingStats
  };

  positionStats.stats = createStats({
    existingStats: positionStats.stats,
    now,
    win
  });

  positionStats.damageComposition = createDamageComposition({
    totalDamageDealt,
    magicDamageDealt,
    physicalDamageDealt,
    trueDamageDealt,
    existingDamageComposition: positionStats.damageComposition
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

export async function postMatch(req, res) {
  let { matchId, platformId } = req.query;
  if (!matchId || !platformId) {
    return res.status(403).end('Invalid matchId or platformId');
  }
  matchId = parseInt(matchId.trim());
  platformId = platformId.trim().toUpperCase();

  try {
    if (await Matches().findOne({ gameId: matchId, platformId })) {
      res.status(400);
      return res.end('Already analyzed');
    }
    const match = (await thApi.get(`/match?platformId=${platformId}&matchId=${matchId}`)).data;
    const timeline = (await thApi.get(`/timeline?platformId=${platformId}&matchId=${matchId}`))
      .data;

    const now = new Date();
    match.participants.forEach(async participant => {
      try {
        const champ = await Champs().findOne({
          championId: participant.championId
        });

        const { mapId } = match;
        const maps = (champ && champ.maps) || {};
        const win = participant.stats.win ? 1 : 0;

        const map = {
          stats: {},
          positions: {},
          ...(maps[mapId] || {})
        };
        map.stats = createStats({
          data: { mapId },
          existingStats: map.stats,
          now,
          win
        });

        const { role, lane } = participant.timeline;
        const positionId = getPosition({ role, lane });
        map.positions[positionId] = createPositionStats({
          participant,
          now,
          win,
          existingStats: map.positions[positionId],
          timeline
        });

        await Champs().updateOne(
          {
            championId: participant.championId
          },
          {
            $set: {
              [`maps.${match.mapId}`]: map
            }
          },
          {
            upsert: true
          }
        );
      } catch (error) {
        console.log(error);
      }
    });

    const matchesCount = await Matches()
      .find({ mapId: match.mapId })
      .count();

    const championIds = match.participants.map(p => p.championId);
    const banIds = match.teams.reduce(
      (bans, team) => [...bans, ...team.bans.map(ban => ban.championId)],
      []
    );
    await Champs()
      .find({
        [`maps.${match.mapId}`]: { $exists: true }
      })
      .forEach(async champ => {
        const picked = championIds.includes(champ.championId) ? 1 : 0;
        const banned = banIds.includes(champ.championId) ? 1 : 0;
        const map = champ.maps[match.mapId];
        const existingStats = map.stats;
        const pickRate =
          (matchesCount * (existingStats.pickRate || 0) + picked) / (matchesCount + 1);
        const banRate = (matchesCount * (existingStats.banRate || 0) + banned) / (matchesCount + 1);

        await Champs().updateOne(
          {
            championId: champ.championId
          },
          {
            $set: {
              [`maps.${match.mapId}.stats.pickRate`]: pickRate,
              [`maps.${match.mapId}.stats.banRate`]: banRate
            }
          }
        );
      });

    await Matches().insertOne({
      gameId: match.gameId,
      mapId: match.mapId,
      platformId,
      analyzedAt: now
    });

    res.end('Analyzed');
  } catch (error) {
    console.error(error);
    res.status(200).end('Error');
  }
}
