import { Round } from '../models/Round';
import { dataStore } from '../data/DataStore';
import { assignmentService } from './AssignmentService';

/**
 * Service for managing rounds and round generation
 * Provides round creation, retrieval, and navigation capabilities
 */
export class RoundService {
  /**
   * Generate a new round for a league
   * 
   * Process:
   * 1. Validate that players and courts exist
   * 2. Determine the next round number (increment from highest existing round)
   * 3. Create the round entity
   * 4. Delegate to AssignmentService to generate player assignments
   * 5. Store round and return it
   * 
   * @param leagueId - The ID of the league to generate a round for
   * @returns The newly created round
   * @throws Error if no players or no courts exist in the league
   */
  /**
     * Generate a new round for a league
     * 
     * Process:
     * 1. Validate that players and courts exist
     * 2. Determine the next round number (increment from highest existing round)
     * 3. Create the round entity
     * 4. Get previous round assignments if this is not the first round
     * 5. Delegate to AssignmentService to generate player assignments
     * 6. Store round and return it
     * 
     * @param leagueId - The ID of the league to generate a round for
     * @returns The newly created round
     * @throws Error if no players or no courts exist in the league
     */
    generateRound(leagueId: string): Round {
      // Validate players exist
      const players = dataStore.getPlayersByLeague(leagueId);
      if (players.length === 0) {
        throw new Error('Cannot generate round: no players in league');
      }

      // Validate courts exist
      const courts = dataStore.getCourtsByLeague(leagueId);
      if (courts.length === 0) {
        throw new Error('Cannot generate round: no courts in league');
      }

      // Determine next round number
      const existingRounds = dataStore.getRoundsByLeague(leagueId);
      const nextRoundNumber = existingRounds.length > 0
        ? Math.max(...existingRounds.map(r => r.roundNumber)) + 1
        : 1;

      // Create round
      const round: Round = {
        id: dataStore.generateId(),
        leagueId,
        roundNumber: nextRoundNumber,
        createdAt: new Date()
      };

      dataStore.createRound(round);

      // Get previous round assignments if this is not the first round
      let previousAssignments;
      if (existingRounds.length > 0) {
        const previousRound = existingRounds[existingRounds.length - 1];
        previousAssignments = assignmentService.getAssignments(previousRound.id);
      }

      // Generate assignments for this round
      assignmentService.generateAssignments(
        players,
        courts,
        round.id,
        4, // playersPerCourt
        previousAssignments
      );

      return round;
    }

  /**
   * Get a specific round by round number
   * 
   * @param leagueId - The ID of the league
   * @param roundNumber - The round number to retrieve
   * @returns The round if found
   * @throws Error if round not found
   */
  getRound(leagueId: string, roundNumber: number): Round {
    const rounds = dataStore.getRoundsByLeague(leagueId);
    const round = rounds.find(r => r.roundNumber === roundNumber);
    
    if (!round) {
      throw new Error('Round not found');
    }
    
    return round;
  }

  /**
   * List all rounds for a league in chronological order
   * 
   * @param leagueId - The ID of the league
   * @returns Array of rounds sorted by round number (ascending)
   */
  listRounds(leagueId: string): Round[] {
    return dataStore.getRoundsByLeague(leagueId);
  }

  /**
   * Get the most recent round for a league
   * 
   * @param leagueId - The ID of the league
   * @returns The most recent round
   * @throws Error if no rounds exist
   */
  getCurrentRound(leagueId: string): Round {
    const rounds = dataStore.getRoundsByLeague(leagueId);
    
    if (rounds.length === 0) {
      throw new Error('No rounds found for league');
    }
    
    // Rounds are already sorted by round number, so get the last one
    return rounds[rounds.length - 1];
  }
}

// Export singleton instance
export const roundService = new RoundService();
