import Champs, { findChamp, updateChamp, ChampMapStats, ChampAverageStats } from '../models/Champs';
import { hasAnalyzedMatch, countMatches, insertAnalyzedMatch } from '../models/AnalyzedMatches';
import getPosition from '../utils/getPosition';
import createId from '../utils/createId';
import getSkillOrder from '../utils/getSkillOrder';
import getItemsPurchased from '../utils/getItemsPurchased';
import updateMatchupStats from '../utils/updateMatchupStats';
import { createMatch } from '../models/Match';

import { sortNumbers } from './sort';
import { ParticipantStatsDTO, TimelineDTO, TimelineEvent } from '../types';

export default async function analyzeMatch(platformId, matchId) {
  console.log(`Analyze ${platformId} ${matchId}`);

  try {
    if (await hasAnalyzedMatch(platformId, matchId)) {
      console.log(`Match already analyzed`);
      return;
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
        [`maps.${mapId}`]: { $exists: true }
      })
      .toArray()).map(champ => {
      const picked = champIds.includes(champ.champId) ? 1 : 0;
      const banned = banIds.includes(champ.champId) ? 1 : 0;
      const map = champ.maps[mapId];
      const existingStats = map.stats;
      const pickRate = (matchesCount * (existingStats.pickRate || 0) + picked) / (matchesCount + 1);
      const banRate = (matchesCount * (existingStats.banRate || 0) + banned) / (matchesCount + 1);

      return Champs().updateOne(
        {
          champId: champ.champId
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
  } catch (error) {
    console.log(`Error ${platformId} ${matchId}`, error);
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

function getParticipantFrames(timeline: TimelineDTO, participantId: number) {
  return timeline.frames.reduce(
    (acc, cur) => {
      const participantFrames = cur.events.filter(event => event.participantId === participantId);
      return [...acc, ...participantFrames];
    },
    [] as TimelineEvent[]
  );
}

function createAverageStats(
  stats: ParticipantStatsDTO,
  existingDamageComposition: ChampAverageStats,
  matches,
  timeline: TimelineDTO,
  participantId
) {
  const keys = [
    'totalDamageDealt',
    'trueDamageDealt',
    'magicDamageDealt',
    'physicalDamageDealt',
    'kills',
    'deaths',
    'assists',
    'firstBloodKill'
  ];

  const participantFrames = getParticipantFrames(timeline, participantId);

  const snowballKills = participantFrames.filter(
    event => event.killerId === participantId && event.timestamp < 720000
  ).length;

  return keys.reduce(
    (obj, key) => {
      return {
        ...obj,
        [key]: ((matches - 1) * Number(existingDamageComposition[key]) + stats[key]) / matches
      };
    },
    {
      snowballKills
    } as ChampAverageStats
  );
}

function createPositionStats({ participant, existingStats = {}, now, win, timeline }) {
  const positionStats = {
    stats: {
      matches: 0
    },
    spells: {},
    items: {
      '2-12': {
        stats: {},
        items: {}
      },
      '12-22': {
        stats: {},
        items: {}
      },
      '22-32': {
        stats: {},
        items: {}
      },
      '32-42': {
        stats: {},
        items: {}
      },
      '42-52': {
        stats: {},
        items: {}
      }
    },
    firstItems: {},
    perks: {},
    skillOrder: {},
    averageStats: {
      totalDamageDealt: 0,
      trueDamageDealt: 0,
      magicDamageDealt: 0,
      physicalDamageDealt: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      snowballKills: 0
    },
    ...existingStats
  };

  positionStats.stats = createStats({
    data: {},
    existingStats: positionStats.stats || {},
    now,
    win
  });

  positionStats.averageStats = createAverageStats(
    participant.stats,
    positionStats.averageStats,
    positionStats.stats.matches,
    timeline,
    participant.participantId
  );

  const [spell1Id, spell2Id] = [participant.spell1Id, participant.spell2Id].sort(sortNumbers);
  const spells = { spell1Id, spell2Id };
  const spellsId = createId(spells);
  positionStats.spells[spellsId] = createStats({
    data: spells,
    existingStats: positionStats.spells[spellsId],
    now,
    win
  });

  const {
    perkPrimaryStyle,
    perkSubStyle,
    perk0,
    perk1,
    perk2,
    perk3,
    perk4,
    perk5,
    statPerk0,
    statPerk1,
    statPerk2
  } = participant.stats;
  const perks = {
    perkPrimaryStyle,
    perkSubStyle,
    perk0,
    perk1,
    perk2,
    perk3,
    perk4,
    perk5,
    statPerk0,
    statPerk1,
    statPerk2
  };
  const perkIds = createId(perks);
  positionStats.perks[perkIds] = createStats({
    data: perks,
    existingStats: positionStats.perks[perkIds],
    now,
    win
  });

  // Select first 10 skills. In most games champs are not max lvl.
  const skillOrder = getSkillOrder({ timeline, participantId: participant.participantId }).splice(
    0,
    10
  );
  if (skillOrder.length === 10) {
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
      const currentPositionStats = positionStats.items[`${from}-${from + 10}`];
      currentPositionStats.stats = createStats({
        data: {},
        existingStats: currentPositionStats.stats,
        now,
        win
      });
      items.forEach(itemId => {
        currentPositionStats.items[itemId] = createStats({
          data: {
            itemId
          },
          existingStats: currentPositionStats.items[itemId],
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
