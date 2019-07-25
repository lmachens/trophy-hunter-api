import { ChampStats } from '../models/Champs';

export function sortNumbers(a: number, b: number) {
  return a - b;
}

export function sortWinRate(a: ChampStats, b: ChampStats) {
  return b.winRate - a.winRate;
}
