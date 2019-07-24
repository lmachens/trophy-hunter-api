import axios from 'axios';
import { MatchDTO, TimelineDTO } from '../types';

const thApi = axios.create({
  baseURL: 'https://api-lol.th.gl/'
});

export default thApi;

export function getMatch(platformId: string, matchId: number) {
  return thApi
    .get<MatchDTO>(`/match?platformId=${platformId}&matchId=${matchId}`)
    .then(result => result.data);
}

export function getTimeline(platformId: string, matchId: number) {
  return thApi
    .get<TimelineDTO>(`/timeline?platformId=${platformId}&matchId=${matchId}`)
    .then(result => result.data);
}
