import Champs, { findChamp, updateChamp, ChampMapStats } from '../models/Champs';
import { hasAnalyzedMatch, countMatches, insertAnalyzedMatch } from '../models/AnalyzedMatches';
import getPosition from '../utils/getPosition';
import createId from '../utils/createId';
import getSkillOrder from '../utils/getSkillOrder';
import getItemsPurchased from '../utils/getItemsPurchased';
import updateMatchupStats from '../utils/updateMatchupStats';
import { createMatch } from '../models/Match';
import { getMongoDb } from '../utils/mongo';
import Agenda from 'agenda';

let agenda = null;

export async function createAnalyzeMatchTask(platformId: string, matchId: number) {
  const job = agenda.create('analyze match', { platformId, matchId });
  await job.save();
  console.log('Job successfully saved');
}

export function initTasks() {
  agenda = new Agenda({
    mongo: getMongoDb(),
    defaultConcurrency: 1
  });

  agenda.define('analyze match', analyzeMatch);

  agenda.start();

  console.log('Tasks initialized');
}

async function analyzeMatch(job, done) {
  const { platformId, matchId } = job.attrs.data;

  console.log(`Analyze ${platformId} ${matchId}`);

  try {
    if (await hasAnalyzedMatch(platformId, matchId)) {
      console.log(`Match already analyzed`);
      return done();
    }

    const match = await createMatch(platformId, matchId);

    const now = new Date();
    const analyseParticipants = match.participants.map(async participant => {
      const { championId, stats, timeline } = participant;
      const { mapId } = match;
      const champ = await findChamp(championId, mapId);

      const maps = (champ && champ.maps) || {};
      const win = stats.win ? 1 : 0;

      const existingMap = maps[mapId] || {
        stats: {},
        positions: {}
      };
      const { role, lane } = timeline;
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

      return updateChamp(championId, mapId, map);
    });

    await Promise.all(analyseParticipants);

    const { banIds, champIds, mapId } = match;
    const matchesCount = await countMatches(mapId);

    const updateChamps = (await Champs()
      .find({
        [`maps.${match.mapId}`]: { $exists: true }
      })
      .toArray()).map(champ => {
      const picked = champIds.includes(champ.champId) ? 1 : 0;
      const banned = banIds.includes(champ.champId) ? 1 : 0;
      const map = champ.maps[match.mapId];
      const existingStats = map.stats;
      const pickRate = (matchesCount * (existingStats.pickRate || 0) + picked) / (matchesCount + 1);
      const banRate = (matchesCount * (existingStats.banRate || 0) + banned) / (matchesCount + 1);

      return Champs().updateOne(
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

    await Promise.all(updateChamps);

    await insertAnalyzedMatch({
      gameId: match.gameId,
      mapId: match.mapId,
      platformId,
      analyzedAt: now
    });

    await updateMatchupStats(match);
    console.log(`Done ${platformId} ${matchId}`);
    done();
  } catch (error) {
    console.log(`Error ${platformId} ${matchId}`, error);
    done(error);
  }
}

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
