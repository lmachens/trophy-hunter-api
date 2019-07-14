import Champs from '../models/champs';

export async function getChamps(_req, res) {
  const champs = await Champs()
    .find({})
    .toArray();
  res.json(champs);
}

export async function getChamp(req, res) {
  const champs = await Champs().findOne({ id: req });

  res.json(champs);
}
