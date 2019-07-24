import { collection } from '../utils/mongo';

export default function Jobs() {
  const Jobs = collection<Job>('jobs');
  return Jobs;
}

export interface Job {
  _id?: string;
  platformId: string;
  matchId: number;
}
