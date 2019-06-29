import express from 'express';
import match from './match.json';

const port = 5000;
const app = express();

app.get('/', (_req, res) => {
  res.writeHead(200);
  res.end(JSON.stringify(match));
});

app.listen(port, () => {
  console.log('Trophy Hunter LoL API is running!');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Version:', process.version);
});
