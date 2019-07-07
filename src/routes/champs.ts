import Champs from 'models/champs';

export async function getChamps(_req, res) {
  const champs = await Champs.find({});

  res.writeHead(200);
  res.end(JSON.stringify(champs));
}

export async function getChamp(req, res) {
  console.log(req);
  const champs = await Champs.findOne({ id: req });

  res.writeHead(200);
  res.end(JSON.stringify(champs));
}
