import { Maps } from './Maps';

export interface MatchDTO {
  gameId: number;
  mapId: Maps;
  participants: ParticipantDTO[];
  teams: TeamStatsDTO[];
}

export interface ParticipantDTO {
  teamId: TeamIds;
  championId: number;
  stats: ParticipantStatsDTO;
  timeline: ParticipantTimelineDTO;
}

export type TeamIds = 100 | 200;

export interface TeamStatsDTO {
  bans: TeamBansDTO[];
}

export interface TeamBansDTO {
  pickTurn: number;
  championId: number;
}

export interface ParticipantStatsDTO {
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealt: number;
  trueDamageDealt: number;
  magicDamageDealt: number;
  physicalDamageDealt: number;
  firstBloodKill: boolean;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  killingSprees: number;
  totalMinionsKilled: number;
}

export interface ParticipantTimelineDTO {
  lane: Lane;
  role: Role;
}

export type Lane = 'MIDDLE' | 'TOP' | 'JUNGLE' | 'BOTTOM';

export type Role = 'DUO' | 'NONE' | 'SOLO' | 'DUO_CARRY' | 'DUO_SUPPORT';
