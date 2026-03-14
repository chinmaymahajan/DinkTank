/**
 * Assignment entity representing player assignments to courts and teams
 * 
 * Constraints:
 * - Each assignment must reference a valid round and court
 * - team1PlayerIds and team2PlayerIds must contain valid player IDs
 * - Teams should typically contain equal numbers of players (e.g., 2v2)
 * - A player should not appear in multiple assignments within the same round
 */
export interface Assignment {
  id: string;
  roundId: string;
  courtId: string;
  team1PlayerIds: string[];
  team2PlayerIds: string[];
  createdAt: Date;
}
