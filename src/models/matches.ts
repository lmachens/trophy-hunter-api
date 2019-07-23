import { collection } from '../utils/mongo';

export default () => {
  const Matches = collection('matches');
  Matches.createIndex({
    gameId: 1,
    platformId: 1
  });
  Matches.createIndex({
    mapId: 1
  });
  return Matches;
};
