import { MatchDTO, TimelineDTO, TeamIds } from '../types';
import { getMatch, getTimeline } from '../utils/th-api';

/**
 * A class which helps to access match and timeline
 */
class Match {
  private matchDto: MatchDTO;
  private timelineDto: TimelineDTO;

  constructor(matchDto: MatchDTO, timelineDto: TimelineDTO) {
    this.matchDto = matchDto;
    this.timelineDto = timelineDto;
  }

  get gameId() {
    return this.matchDto.gameId;
  }

  get mapId() {
    return this.matchDto.mapId;
  }

  get team1() {
    return this.getTeam(100);
  }

  get team2() {
    return this.getTeam(200);
  }

  get participants() {
    return this.matchDto.participants;
  }

  get timeline() {
    return this.timelineDto;
  }

  get championIds() {
    return this.matchDto.participants.map(p => p.championId);
  }

  get banIds() {
    return this.matchDto.teams.reduce(
      (bans, team) => [...bans, ...team.bans.map(ban => ban.championId)],
      []
    );
  }

  private getTeam(teamId: TeamIds) {
    return this.matchDto.participants.filter(participant => participant.teamId === teamId);
  }
}

export default Match;

/**
 * Fetches match and timeline and returns a new instance of Match
 *
 * @param platformId
 * @param matchId
 */
export async function createMatch(platformId: string, matchId: number) {
  const [matchDto, timelineDto] = await Promise.all([
    getMatch(platformId, matchId),
    getTimeline(platformId, matchId)
  ]);

  return new Match(matchDto, timelineDto);
}
