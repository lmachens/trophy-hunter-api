import Matchups from '../models/matchups';

function createStats({ participantStats, existingStats = {}, matches }) {
  const stats = {
    kills: 0,
    deaths: 0,
    assists: 0,
    winRate: 0,
    ...existingStats
  };
  stats.winRate = (matches * stats.winRate + participantStats.win) / (matches + 1);
  stats.kills = (matches * stats.kills + participantStats.kills) / (matches + 1);
  stats.deaths = (matches * stats.deaths + participantStats.deaths) / (matches + 1);
  stats.assists = (matches * stats.assists + participantStats.assists) / (matches + 1);

  return stats;
}

function updateMatchupStats({ match }) {
  const team1 = match.participants.filter(participant => participant.teamId === 100);
  const team2 = match.participants.filter(participant => participant.teamId === 200);

  team1.forEach(participant => {
    team2.forEach(async opponent => {
      let championId1;
      let championId2;

      if (participant.championId > opponent.championId) {
        championId1 = opponent.championId;
        championId2 = participant.championId;
      } else {
        championId1 = participant.championId;
        championId2 = opponent.championId;
      }

      const matchup = await Matchups().findOne({
        championId1,
        championId2
      });
      const maps = (matchup && matchup.maps) || {};
      const map = {
        matches: 0,
        champion1: {},
        champion2: {},
        ...(maps[match.mapId] || {})
      };

      map.champion1 = createStats({
        existingStats: map.champion1,
        participantStats: participant.stats,
        matches: map.matches
      });

      map.champion2 = createStats({
        existingStats: map.champion1,
        participantStats: opponent.stats,
        matches: map.matches
      });

      map.matches++;

      await Matchups().updateOne(
        {
          championId1,
          championId2
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
    });
  });
}

export default updateMatchupStats;
