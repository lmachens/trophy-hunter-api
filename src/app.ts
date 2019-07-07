import express from 'express';
import match from './match.json';
import { connect } from './utils/mongo';
import { getChamps, getChamp } from 'routes/champs';

const port = 5000;
const app = express();

connect().then(() => {
  app.get('/', (_req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify(match));
  });

  app.get('/champs', getChamps);
  app.get('/champs/:id', getChamp);

  app.listen(port, () => {
    console.log(`Trophy Hunter LoL API is running! http://localhost:${port}`);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Version:', process.version);
  });
});
