import Matchups, { updateMatchup, MatchupChampionStats } from '../models/Matchups';
import Match from '../models/Match';
import { ParticipantStatsDTO } from '../types';
import { sortNumbers } from './sort';

function createChampStats(
  participantStats: ParticipantStatsDTO,
  existingStats: MatchupChampionStats,
  matches: number
) {
  return {
    winRate: (matches * existingStats.winRate + Number(participantStats.win)) / (matches + 1),
    kills: (matches * existingStats.kills + participantStats.kills) / (matches + 1),
    deaths: (matches * existingStats.deaths + participantStats.deaths) / (matches + 1),
    assists: (matches * existingStats.assists + participantStats.assists) / (matches + 1)
  };
}

function updateMatchupStats(match: Match) {
  const { team1, team2 } = match;

  const team1Promises = team1.map(participant => {
    const team2Promises = team2.map(async opponent => {
      const [champ1Id, champ2Id] = [participant.championId, opponent.championId].sort(sortNumbers);

      const matchup = await Matchups().findOne({
        champ1Id,
        champ2Id
      });
      const maps = (matchup && matchup.maps) || {};
      const map = {
        matches: 0,
        champ1: {
          kills: 0,
          deaths: 0,
          assists: 0,
          winRate: 0
        },
        champ2: { kills: 0, deaths: 0, assists: 0, winRate: 0 },
        ...(maps[match.mapId] || {})
      };

      map.champ1 = createChampStats(participant.stats, map.champ1, map.matches);
      map.champ2 = createChampStats(opponent.stats, map.champ1, map.matches);

      map.matches++;

      return updateMatchup(champ1Id, champ2Id, match.mapId, map);
    });
    return Promise.all(team2Promises);
  });

  return Promise.all(team1Promises);
}

export default updateMatchupStats;
