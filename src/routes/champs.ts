import Champs from '../models/champs';

// not implemented
export async function getChamps(_req, res) {
  const champs = await Champs()
    .find({})
    .toArray();
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(champs);
}

export async function getChamp(req, res) {
  const { mapId } = req.query;
  const championId = parseInt(req.params.championId);
  if (!mapId || !championId) {
    return res.status(403).end('Invalid mapId or championId');
  }

  const champ = await Champs().findOne(
    { championId, [`maps.${mapId}`]: { $exists: true } },
    {
      projection: {
        _id: false,
        championId: true,
        [`maps.${mapId}`]: true
      }
    }
  );

  res.set('Cache-Control', 'public, max-age=86400');
  res.json(champ);
}
