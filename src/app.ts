import express from 'express';
import match from './match.json';
import { connect, db } from './mongo';

const port = 5000;
const app = express();

connect().then(() => {
  const thDb = db('trophy_hunter');
  const collection = thDb.collection('ChampionStats');

  app.get('/', (_req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify(match));
  });

  app.get('/champs', async (_req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify(await collection.findOne({})));
  });

  app.listen(port, () => {
    console.log(`Trophy Hunter LoL API is running! http://localhost:${port}`);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Version:', process.version);
  });
});
