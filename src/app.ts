import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { connect } from './utils/mongo';
import { getChamp } from './routes/champs';
import { postMatch } from './routes/matches';
import { getMatchup } from './routes/matchups';
import { initTasks } from './utils/tasks';

const port = 5000;
const app = express();

connect().then(() => {
  initTasks();

  app.use(compression());
  app.use(cors());

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
