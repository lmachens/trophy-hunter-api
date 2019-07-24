import Champs from '../models/Champs';
import { Request, Response } from 'express';

export async function getChamp(req: Request, res: Response) {
  const championId = parseInt(req.params.championId);
  const mapId = parseInt(req.params.mapId);

  if (isNaN(req.query.mapId) || isNaN(championId)) {
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
