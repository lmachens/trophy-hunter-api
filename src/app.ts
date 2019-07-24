import express from 'express';
import { connect } from './utils/mongo';
import { getChamp } from './routes/champs';
import { postMatch } from './routes/matches';
import { getMatchup } from './routes/matchups';

const port = 5000;
const app = express();

connect().then(() => {
  app.get('/', (_req, res) => {
    res.end('API');
  });

  app.get('/champs', getChamp);
  app.get('/matchups', getMatchup);
  app.post('/matches', postMatch);

  app.listen(port, () => {
    console.log(`Trophy Hunter LoL API is running! http://localhost:${port}`);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Version:', process.version);
  });
});
