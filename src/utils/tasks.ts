import Jobs from '../models/Jobs';
import analyzeMatch from './analyzeMatch';

export async function createAnalyzeMatchTask(platformId: string, matchId: number) {
  await Jobs().insertOne({ platformId, matchId });
  console.log('Job successfully saved', platformId, matchId);
}

async function getNextTask() {
  const job = await Jobs().findOne({});
  if (job) {
    await analyzeMatch(job.platformId, job.matchId);
    await Jobs().deleteOne({ _id: job._id });
  }
  setTimeout(getNextTask, 10000);
}

export function initTasks() {
  setTimeout(getNextTask, 5000);
  console.log('Tasks initialized');
}
