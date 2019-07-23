import { sortNumbers } from './sort';

function createId(data) {
  const ids = [...Object.values(data)].sort(sortNumbers);
  return ids.join('-');
}

export default createId;
