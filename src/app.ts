import express from 'express';
import { connect } from './utils/mongo';
import { getChamps, getChamp } from './routes/champs';
import { putMatch } from './routes/matches';

const port = 5000;
const app = express();

connect().then(() => {
  app.get('/', (_req, res) => {
    res.end('API');
  });

  app.get('/champs', getChamps);
  app.get('/champs/:id', getChamp);
  app.put('/matches', putMatch);

  app.listen(port, () => {
    console.log(`Trophy Hunter LoL API is running! http://localhost:${port}`);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Version:', process.version);
  });
});
