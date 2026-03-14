/**
 * Court entity representing a physical pickleball court
 * 
 * Constraints:
 * - identifier must not be empty or whitespace-only
 * - identifier should be unique within a league
 */
export interface Court {
  id: string;
  leagueId: string;
  identifier: string;
  createdAt: Date;
}
