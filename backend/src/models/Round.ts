/**
 * Round entity representing a single iteration of play
 * 
 * Constraints:
 * - roundNumber must be positive and sequential
 * - roundNumber must be unique within a league
 */
export interface Round {
  id: string;
  leagueId: string;
  roundNumber: number;
  createdAt: Date;
}
