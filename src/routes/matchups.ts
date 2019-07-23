import Matchups from '../models/matchups';

export async function getMatchup(req, res) {
  let { mapId, championId1, championId2 } = req.query;
  if (!mapId || !championId1 || !championId2) {
    return res.status(403).end('Invalid mapId or championId');
  }
  championId1 = parseInt(championId1);
  championId2 = parseInt(championId2);

  const champ = await Matchups().findOne(
    {
      [`maps.${mapId}`]: { $exists: true },
      $or: [
        {
          championId1,
          championId2
        },
        {
          championId1: championId2,
          championId2: championId1
        }
      ]
    },
    {
      projection: {
        _id: false,
        championId1: true,
        championId2: true,
        [`maps.${mapId}`]: true
      }
    }
  );

  res.set('Cache-Control', 'public, max-age=86400');
  res.json(champ);
}
