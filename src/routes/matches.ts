import match from '../match.json';
import Champs from '../models/champs';

export async function putMatch(req, res) {
  const { matchId } = req.query;
  if (!matchId) {
    return res.end(403, 'Invalid matchId');
  }

  match.participants.forEach(async participant => {
    try {
      const champ = (await Champs().findOne({
        id: participant.championId
      })) || {
        id: participant.championId,
        matches: 0,
        winRate: 0
      };

      const wins = champ.matches * champ.winRate;
      champ.matches++;
      champ.winRate = (wins + (participant.stats.win ? 1 : 0)) / champ.matches;
      await Champs().updateOne(
        {
          id: participant.championId
        },
        {
          $set: champ
        },
        {
          upsert: true
        }
      );
    } catch (error) {
      console.log(error);
      res.end(400, error.message);
    }
  });
  res.end(matchId);
}
