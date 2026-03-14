/**
 * Player entity representing a participant in a league
 * 
 * Constraints:
 * - name must not be empty or whitespace-only
 * - name should be unique within a league (recommended but not strictly enforced)
 */
export interface Player {
  id: string;
  leagueId: string;
  name: string;
  createdAt: Date;
}
