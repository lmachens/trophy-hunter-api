import match from '../match.json';
import Champs from '../models/champs';
import Matches from '../models/matches';
import { MatchV4 } from 'riot-api-typedef';
import { sortNumbers } from '../utils/sort';

export async function postMatch(req, res) {
  const { matchId } = req.query;
  if (!matchId) {
    return res.end(403, 'Invalid matchId');
  }

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
      const positionId = createId({ role, lane });
      map.positions[positionId] = createPositionStats({
        participant,
        now,
        win,
        existingStats: map.positions[positionId]
      });

      await Matches().insertOne({
        gameId: match.gameId,
        analyzedAt: now
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
  res.end(matchId);
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
    data: { role: participant.timeline.role, lane: participant.timeline.lane },
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

function createStats({ data, existingStats = {}, now, win }) {
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
