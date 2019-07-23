import { collection } from '../utils/mongo';

export default () => {
  const Matchups = collection('matchups');
  Matchups.createIndex({
    champ1Id: 1,
    champ2Id: 2,
    position: 1
  });
  return Matchups;
};
