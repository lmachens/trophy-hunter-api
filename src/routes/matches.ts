import { Request, Response } from 'express';
import { createAnalyzeMatchTask } from '../utils/tasks';

export async function postMatch(req: Request, res: Response) {
  const platformId = req.query.platformId && req.query.platformId.trim().toUpperCase();
  const matchId = parseInt(req.query.matchId);
  if (isNaN(matchId) || typeof platformId !== 'string') {
    return res.status(403).end('Invalid matchId or platformId');
  }

  await createAnalyzeMatchTask(platformId, matchId);

  res.end('Added to queue');
}
