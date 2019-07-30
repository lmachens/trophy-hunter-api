# Trophy Hunter Champs Api

Open API for League of Legends champion stats.

## Public API

This API is deployed on https://champs.th.gl.

## Which stats are calculated?

For every analyzed match, champion stats are calculated for every participant. These stats are grouped by map and [position](#position-detection).

Winrates are calculated for champions, matchups, items, spells, perks and skills. In addition, average stats like kills, deaths, assists or damage are calculated.

## How to get champion stats?

Send a GET request to `/champs?champId=CHAMP_ID&mapId=MAP_ID`.

## How to get matchup stats?

Send a GET request to `/matchups?champ1Id=CHAMP_ID&champ2Id=CHAMP_ID&mapId=MAP_ID`.

## How to analyze a match?

Send a POST request to `/matches?platformId=PLATFORM_ID&matchId=MATCH_ID`.
The match is added to a queue to avoid calculating multiple matches at the same time, which is not supported right now. Every few seconds, this queue is processed.

## Position detection

The position is defined by the role and lane of a participant. Sadly, this data is sometimes not very accurate. Possible values are TOP, JUNGLE, MIDDLE, BOTTOM and UTILITY.
