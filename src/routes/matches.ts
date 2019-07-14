import Champs from '../models/champs';
import Matches from '../models/matches';
import { MatchV4 } from 'riot-api-typedef';
import { sortNumbers } from '../utils/sort';
import thApi from '../utils/th-api';

export async function postMatch(req, res) {
  let { matchId, platformId } = req.query;
  if (!matchId || !platformId) {
    return res.end(403, 'Invalid matchId');
  }
  matchId = parseInt(matchId.trim());
  platformId = platformId.trim().toUpperCase();

  try {
    if (await Matches().findOne({ gameId: matchId, platformId })) {
      res.status(400);
      return res.end('Already analyzed');
    }
    const match = (await thApi.get(`/match?platformId=${platformId}&matchId=${matchId}`)).data;

    const now = new Date();
    match.participants.forEach(async (participant: MatchV4.ParticipantDTO) => {
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
          existingStats: map.positions[positionId]
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

        const existingStats = champ.maps[match.mapId].stats;
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

function createPositionStats({ participant, existingStats = {}, now, win }) {
  const positionStats = {
    stats: {},
    spells: {},
    items: {},
    perks: {},
    ...existingStats
  };

  positionStats.stats = createStats({
    existingStats: positionStats.stats,
    now,
    win
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

  const { item0, item1, item2, item3, item4, item5, item6 } = participant.stats;
  const items = { item0, item1, item2, item3, item4, item5, item6 };
  const itemsId = createId(items);
  positionStats.items[itemsId] = createStats({
    data: items,
    existingStats: positionStats.items[itemsId],
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

  return positionStats;
}

function createId(data) {
  const ids = [...Object.values(data)].sort(sortNumbers);
  return ids.join('-');
}

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

const getPosition = ({ role, lane }) => {
  if (lane === 'JUNGLE') {
    return 'JUNGLE';
  }

  switch (role) {
    case 'DUO':
    case 'DUO_CARRY':
      if (lane === 'MIDDLE') {
        return 'MIDDLE';
      }
      if (lane === 'TOP') {
        return 'TOP';
      }
      return 'BOTTOM';
    case 'DUO_SUPPORT':
      return 'UTILITY';
    case 'SOLO':
      if (lane === 'TOP') {
        return 'TOP';
      }
      if (lane === 'MIDDLE') {
        return 'MIDDLE';
      }
  }
  return 'TOP';
};
