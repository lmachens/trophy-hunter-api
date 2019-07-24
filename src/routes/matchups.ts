import Matchups from '../models/Matchups';

export async function getMatchup(req, res) {
  const mapId = parseInt(req.query.mapId);
  const champ1Id = parseInt(req.query.champ1Id);
  const champ2Id = parseInt(req.query.champ2Id);
  if (isNaN(mapId) || isNaN(champ1Id) || isNaN(champ2Id)) {
    return res.status(403).end('Invalid mapId or championId');
  }

  const champ = await Matchups().findOne(
    {
      [`maps.${mapId}`]: { $exists: true },
      $or: [
        {
          champ1Id,
          champ2Id
        },
        {
          champ1Id: champ2Id,
          champ2Id: champ1Id
        }
      ]
    },
    {
      projection: {
        _id: false,
        champ1Id: true,
        champ2Id: true,
        [`maps.${mapId}`]: true
      }
    }
  );

  res.set('Cache-Control', 'public, max-age=86400');
  res.json(champ);
}
