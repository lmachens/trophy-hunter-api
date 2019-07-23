import { collection } from '../utils/mongo';

export default () => {
  const Champs = collection('champs');
  Champs.createIndex({
    championId: 1
  });
  return Champs;
};
