import { Assignment } from '../models/Assignment';
import { Player } from '../models/Player';
import { Court } from '../models/Court';
import { dataStore } from '../data/DataStore';
import { shuffle } from '../utils/shuffle';

/**
 * Service for managing player assignments to courts and teams
 * Provides assignment generation, retrieval, and reassignment capabilities
 */
export class AssignmentService {
  /**
   * Generate assignments for a round by distributing players across courts
   * 
   * Algorithm:
   * 1. Shuffle players randomly using Fisher-Yates algorithm
   * 2. Calculate players per court (default 4 for 2v2 pickleball)
   * 3. Assign players to courts sequentially
   * 4. Form teams by splitting court players (first half vs second half)
   * 5. Handle overflow players with bye/waiting system
   * 
   * @param players - Array of players to assign
   * @param courts - Array of available courts
   * @param roundId - The ID of the round these assignments belong to
   * @param playersPerCourt - Number of players per court (default 4 for 2v2)
   * @returns Array of assignments with team compositions
   */
  /**
     * Generate assignments for a round by distributing players across courts
     * 
     * Algorithm:
     * 1. Shuffle players randomly using Fisher-Yates algorithm
     * 2. Calculate players per court (default 4 for 2v2 pickleball)
     * 3. Assign players to courts sequentially
     * 4. Form teams by splitting court players (first half vs second half)
     * 5. Handle overflow players with bye/waiting system
     * 6. If previousAssignments provided, ensure team compositions differ
     * 
     * @param players - Array of players to assign
     * @param courts - Array of available courts
     * @param roundId - The ID of the round these assignments belong to
     * @param playersPerCourt - Number of players per court (default 4 for 2v2)
     * @param previousAssignments - Optional previous round assignments to ensure variety
     * @returns Array of assignments with team compositions
     */
    generateAssignments(
      players: Player[],
      courts: Court[],
      roundId: string,
      playersPerCourt: number = 4,
      previousAssignments?: Assignment[],
      byeCountMap?: Map<string, number>
    ): Assignment[] {
      // Validate inputs
      if (players.length === 0) {
        throw new Error('Cannot generate assignments: no players available');
      }

      if (courts.length === 0) {
        throw new Error('Cannot generate assignments: no courts available');
      }

      // Build bye count map from previous assignments if not provided
      const effectiveByeCountMap = byeCountMap || new Map<string, number>();

      const maxRetries = 10;
      let attempts = 0;
      let assignments: Assignment[] = [];

      // Keep generating until we get different team compositions or hit max retries
      while (attempts < maxRetries) {
        assignments = this.createAssignments(
          players,
          courts,
          roundId,
          playersPerCourt,
          effectiveByeCountMap
        );

        // If no previous assignments, we're done
        if (!previousAssignments || previousAssignments.length === 0) {
          break;
        }

        // Check if team compositions are different
        if (!this.areTeamCompositionsIdentical(assignments, previousAssignments)) {
          break;
        }

        attempts++;
      }

      // Store assignments in dataStore
      assignments.forEach(assignment => {
        dataStore.createAssignment(assignment);
      });

      return assignments;
    }

    /**
     * Create assignments, prioritizing players with the most byes.
     * Players are sorted by bye count (descending) so those who have sat out
     * the most get priority to play. Within the same bye count, players are
     * shuffled randomly.
     *
     * @private
     */
    private createAssignments(
      players: Player[],
      courts: Court[],
      roundId: string,
      playersPerCourt: number,
      byeCountMap: Map<string, number> = new Map()
    ): Assignment[] {
      const totalSlots = courts.length * playersPerCourt;

      // Group players by bye count
      const byeCountGroups = new Map<number, Player[]>();
      for (const p of players) {
        const count = byeCountMap.get(p.id) || 0;
        if (!byeCountGroups.has(count)) byeCountGroups.set(count, []);
        byeCountGroups.get(count)!.push(p);
      }

      // Sort groups by bye count descending (most byes first = highest priority)
      const sortedCounts = [...byeCountGroups.keys()].sort((a, b) => b - a);

      // Shuffle within each group, then concatenate
      const ordered: Player[] = [];
      for (const count of sortedCounts) {
        ordered.push(...shuffle([...byeCountGroups.get(count)!]));
      }

      // Only take as many as we have court slots for
      const playersToAssign = ordered.slice(0, totalSlots);

      // Shuffle the final list so high-bye players aren't always on the same courts
      const finalOrder = shuffle([...playersToAssign]);

      const assignments: Assignment[] = [];
      let playerIndex = 0;

      for (const court of courts) {
        const courtPlayers = finalOrder.slice(
          playerIndex,
          playerIndex + playersPerCourt
        );

        if (courtPlayers.length === playersPerCourt) {
          const teamSize = playersPerCourt / 2;
          const team1 = courtPlayers.slice(0, teamSize);
          const team2 = courtPlayers.slice(teamSize);

          const assignment: Assignment = {
            id: dataStore.generateId(),
            roundId,
            courtId: court.id,
            team1PlayerIds: team1.map(p => p.id),
            team2PlayerIds: team2.map(p => p.id),
            createdAt: new Date()
          };

          assignments.push(assignment);
        }

        playerIndex += playersPerCourt;

        if (playerIndex >= finalOrder.length) {
          break;
        }
      }

      return assignments;
    }

    /**
     * Check if team compositions are identical between two sets of assignments
     * 
     * Two team compositions are considered identical if all teams from the new
     * assignments exist in the previous assignments (regardless of court assignment)
     * 
     * @private
     */
    private areTeamCompositionsIdentical(
      newAssignments: Assignment[],
      previousAssignments: Assignment[]
    ): boolean {
      // Extract all teams from both assignment sets
      const newTeams = this.extractTeams(newAssignments);
      const previousTeams = this.extractTeams(previousAssignments);

      // If different number of teams, they can't be identical
      if (newTeams.length !== previousTeams.length) {
        return false;
      }

      // Check if all new teams exist in previous teams
      return newTeams.every(newTeam => 
        previousTeams.some(prevTeam => this.areTeamsEqual(newTeam, prevTeam))
      );
    }

    /**
     * Extract all teams from assignments as sorted player ID arrays
     * 
     * @private
     */
    private extractTeams(assignments: Assignment[]): string[][] {
      const teams: string[][] = [];

      for (const assignment of assignments) {
        teams.push([...assignment.team1PlayerIds].sort());
        teams.push([...assignment.team2PlayerIds].sort());
      }

      return teams;
    }

    /**
     * Check if two teams have the same players
     * 
     * @private
     */
    private areTeamsEqual(team1: string[], team2: string[]): boolean {
      if (team1.length !== team2.length) {
        return false;
      }

      // Both arrays should already be sorted
      return team1.every((playerId, index) => playerId === team2[index]);
    }

  /**
   * Get all assignments for a specific round
   * 
   * @param roundId - The ID of the round
   * @returns Array of assignments for the round, sorted by court identifier
   */
  getAssignments(roundId: string): Assignment[] {
    const assignments = dataStore.getAssignmentsByRound(roundId);
    
    // Sort assignments by court identifier for consistent display
    return assignments.sort((a, b) => {
      const courtA = dataStore.getCourt(a.courtId);
      const courtB = dataStore.getCourt(b.courtId);
      
      if (!courtA || !courtB) return 0;
      
      return courtA.identifier.localeCompare(courtB.identifier);
    });
  }
  /**
   * Manually reassign players to courts and teams
   *
   * Accepts manual assignment overrides and updates the specified assignments
   * while preserving assignments that are not being overridden.
   *
   * @param roundId - The ID of the round to update
   * @param manualAssignments - Array of partial assignments with overrides
   * @returns Updated array of all assignments for the round
   * @throws Error if player or court references are invalid
   */
  reassignPlayers(
    roundId: string,
    manualAssignments: Array<{
      courtId: string;
      team1PlayerIds: string[];
      team2PlayerIds: string[];
    }>
  ): Assignment[] {
    // Get existing assignments for the round
    const existingAssignments = dataStore.getAssignmentsByRound(roundId);

    // Validate all player and court references in manual assignments
    for (const manual of manualAssignments) {
      // Validate court exists
      const court = dataStore.getCourt(manual.courtId);
      if (!court) {
        throw new Error(`Court not found: ${manual.courtId}`);
      }

      // Validate all player IDs exist
      const allPlayerIds = [...manual.team1PlayerIds, ...manual.team2PlayerIds];
      for (const playerId of allPlayerIds) {
        const player = dataStore.getPlayer(playerId);
        if (!player) {
          throw new Error(`Player not found: ${playerId}`);
        }
      }
    }

    // Update assignments
    for (const manual of manualAssignments) {
      // Find existing assignment for this court
      const existingAssignment = existingAssignments.find(
        a => a.courtId === manual.courtId
      );

      if (existingAssignment) {
        // Update existing assignment
        dataStore.updateAssignment(existingAssignment.id, {
          team1PlayerIds: manual.team1PlayerIds,
          team2PlayerIds: manual.team2PlayerIds
        });
      } else {
        // Create new assignment if none exists for this court
        const newAssignment: Assignment = {
          id: dataStore.generateId(),
          roundId,
          courtId: manual.courtId,
          team1PlayerIds: manual.team1PlayerIds,
          team2PlayerIds: manual.team2PlayerIds,
          createdAt: new Date()
        };
        dataStore.createAssignment(newAssignment);
      }
    }

    // Return all assignments for the round (including preserved ones)
    return this.getAssignments(roundId);
  }
}

// Export singleton instance
export const assignmentService = new AssignmentService();
