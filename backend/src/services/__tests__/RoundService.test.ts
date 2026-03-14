import { roundService } from '../RoundService';
import { playerService } from '../PlayerService';
import { courtService } from '../CourtService';
import { assignmentService } from '../AssignmentService';
import { dataStore } from '../../data/DataStore';

describe('RoundService', () => {
  beforeEach(() => {
    dataStore.clear();
  });

  describe('generateRound', () => {
    it('should generate round 1 for a new league', () => {
      const leagueId = 'league1';
      
      // Add players and courts
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      courtService.addCourt(leagueId, 'Court 1');

      const round = roundService.generateRound(leagueId);

      expect(round).toBeDefined();
      expect(round.id).toBeDefined();
      expect(round.leagueId).toBe(leagueId);
      expect(round.roundNumber).toBe(1);
      expect(round.createdAt).toBeInstanceOf(Date);
    });

    it('should increment round number for subsequent rounds', () => {
      const leagueId = 'league1';
      
      // Add players and courts
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      const round1 = roundService.generateRound(leagueId);
      const round2 = roundService.generateRound(leagueId);
      const round3 = roundService.generateRound(leagueId);

      expect(round1.roundNumber).toBe(1);
      expect(round2.roundNumber).toBe(2);
      expect(round3.roundNumber).toBe(3);
    });

    it('should store round in data store', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      courtService.addCourt(leagueId, 'Court 1');

      const round = roundService.generateRound(leagueId);
      const retrieved = dataStore.getRound(round.id);

      expect(retrieved).toEqual(round);
    });

    it('should generate assignments for the round', () => {
      const leagueId = 'league1';
      
      // Add 4 players and 1 court for a full 2v2 match
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      const round = roundService.generateRound(leagueId);
      const assignments = assignmentService.getAssignments(round.id);

      expect(assignments).toHaveLength(1);
      expect(assignments[0].roundId).toBe(round.id);
    });

    it('should throw error when no players exist', () => {
      const leagueId = 'league1';
      
      // Add only courts, no players
      courtService.addCourt(leagueId, 'Court 1');

      expect(() => {
        roundService.generateRound(leagueId);
      }).toThrow('Cannot generate round: no players in league');
    });

    it('should throw error when no courts exist', () => {
      const leagueId = 'league1';
      
      // Add only players, no courts
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');

      expect(() => {
        roundService.generateRound(leagueId);
      }).toThrow('Cannot generate round: no courts in league');
    });

    it('should generate multiple rounds with different assignments', () => {
      const leagueId = 'league1';
      
      // Add 8 players and 2 courts
      for (let i = 1; i <= 8; i++) {
        playerService.addPlayer(leagueId, `Player ${i}`);
      }
      courtService.addCourt(leagueId, 'Court 1');
      courtService.addCourt(leagueId, 'Court 2');

      const round1 = roundService.generateRound(leagueId);
      const round2 = roundService.generateRound(leagueId);

      const assignments1 = assignmentService.getAssignments(round1.id);
      const assignments2 = assignmentService.getAssignments(round2.id);

      // Both rounds should have assignments
      expect(assignments1.length).toBeGreaterThan(0);
      expect(assignments2.length).toBeGreaterThan(0);
      
      // Assignments should be for different rounds
      expect(assignments1[0].roundId).toBe(round1.id);
      expect(assignments2[0].roundId).toBe(round2.id);
    });

    it('should handle odd number of players', () => {
      const leagueId = 'league1';
      
      // Add 5 players and 2 courts (can only fill 1 court with 4 players)
      for (let i = 1; i <= 5; i++) {
        playerService.addPlayer(leagueId, `Player ${i}`);
      }
      courtService.addCourt(leagueId, 'Court 1');
      courtService.addCourt(leagueId, 'Court 2');

      const round = roundService.generateRound(leagueId);
      const assignments = assignmentService.getAssignments(round.id);

      // Should create 1 assignment (4 players), 1 player sits out
      expect(assignments).toHaveLength(1);
    });
  });

  describe('getRound', () => {
    it('should retrieve a specific round by round number', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      const round1 = roundService.generateRound(leagueId);
      const round2 = roundService.generateRound(leagueId);

      const retrieved = roundService.getRound(leagueId, 1);

      expect(retrieved).toEqual(round1);
      expect(retrieved.roundNumber).toBe(1);
    });

    it('should retrieve the correct round when multiple rounds exist', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      roundService.generateRound(leagueId);
      const round2 = roundService.generateRound(leagueId);
      roundService.generateRound(leagueId);

      const retrieved = roundService.getRound(leagueId, 2);

      expect(retrieved).toEqual(round2);
      expect(retrieved.roundNumber).toBe(2);
    });

    it('should throw error when round not found', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      courtService.addCourt(leagueId, 'Court 1');
      roundService.generateRound(leagueId);

      expect(() => {
        roundService.getRound(leagueId, 99);
      }).toThrow('Round not found');
    });

    it('should throw error when no rounds exist', () => {
      const leagueId = 'league1';

      expect(() => {
        roundService.getRound(leagueId, 1);
      }).toThrow('Round not found');
    });

    it('should only retrieve rounds for the specified league', () => {
      const league1Id = 'league1';
      const league2Id = 'league2';
      
      // Setup league 1
      playerService.addPlayer(league1Id, 'Player 1');
      courtService.addCourt(league1Id, 'Court 1');
      const league1Round = roundService.generateRound(league1Id);

      // Setup league 2
      playerService.addPlayer(league2Id, 'Player 2');
      courtService.addCourt(league2Id, 'Court 2');
      roundService.generateRound(league2Id);

      const retrieved = roundService.getRound(league1Id, 1);

      expect(retrieved).toEqual(league1Round);
      expect(retrieved.leagueId).toBe(league1Id);
    });
  });

  describe('listRounds', () => {
    it('should return empty array when no rounds exist', () => {
      const rounds = roundService.listRounds('league1');

      expect(rounds).toEqual([]);
    });

    it('should return all rounds for a league', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      const round1 = roundService.generateRound(leagueId);
      const round2 = roundService.generateRound(leagueId);
      const round3 = roundService.generateRound(leagueId);

      const rounds = roundService.listRounds(leagueId);

      expect(rounds).toHaveLength(3);
      expect(rounds).toContainEqual(round1);
      expect(rounds).toContainEqual(round2);
      expect(rounds).toContainEqual(round3);
    });

    it('should return rounds in chronological order', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      roundService.generateRound(leagueId);
      roundService.generateRound(leagueId);
      roundService.generateRound(leagueId);

      const rounds = roundService.listRounds(leagueId);

      expect(rounds[0].roundNumber).toBe(1);
      expect(rounds[1].roundNumber).toBe(2);
      expect(rounds[2].roundNumber).toBe(3);
    });

    it('should only return rounds for the specified league', () => {
      const league1Id = 'league1';
      const league2Id = 'league2';
      
      // Setup league 1
      playerService.addPlayer(league1Id, 'Player 1');
      courtService.addCourt(league1Id, 'Court 1');
      const league1Round1 = roundService.generateRound(league1Id);
      const league1Round2 = roundService.generateRound(league1Id);

      // Setup league 2
      playerService.addPlayer(league2Id, 'Player 2');
      courtService.addCourt(league2Id, 'Court 2');
      const league2Round1 = roundService.generateRound(league2Id);

      const league1Rounds = roundService.listRounds(league1Id);
      const league2Rounds = roundService.listRounds(league2Id);

      expect(league1Rounds).toHaveLength(2);
      expect(league1Rounds).toContainEqual(league1Round1);
      expect(league1Rounds).toContainEqual(league1Round2);
      expect(league1Rounds).not.toContainEqual(league2Round1);

      expect(league2Rounds).toHaveLength(1);
      expect(league2Rounds).toContainEqual(league2Round1);
      expect(league2Rounds).not.toContainEqual(league1Round1);
    });

    it('should return empty array for league with no rounds', () => {
      const league1Id = 'league1';
      const league2Id = 'league2';
      
      playerService.addPlayer(league1Id, 'Player 1');
      courtService.addCourt(league1Id, 'Court 1');
      roundService.generateRound(league1Id);

      const rounds = roundService.listRounds(league2Id);

      expect(rounds).toEqual([]);
    });
  });

  describe('getCurrentRound', () => {
    it('should return the most recent round', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      roundService.generateRound(leagueId);
      roundService.generateRound(leagueId);
      const round3 = roundService.generateRound(leagueId);

      const currentRound = roundService.getCurrentRound(leagueId);

      expect(currentRound).toEqual(round3);
      expect(currentRound.roundNumber).toBe(3);
    });

    it('should return round 1 when only one round exists', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      courtService.addCourt(leagueId, 'Court 1');

      const round1 = roundService.generateRound(leagueId);
      const currentRound = roundService.getCurrentRound(leagueId);

      expect(currentRound).toEqual(round1);
      expect(currentRound.roundNumber).toBe(1);
    });

    it('should throw error when no rounds exist', () => {
      const leagueId = 'league1';

      expect(() => {
        roundService.getCurrentRound(leagueId);
      }).toThrow('No rounds found for league');
    });

    it('should return the correct current round for specific league', () => {
      const league1Id = 'league1';
      const league2Id = 'league2';
      
      // Setup league 1 with 3 rounds
      playerService.addPlayer(league1Id, 'Player 1');
      courtService.addCourt(league1Id, 'Court 1');
      roundService.generateRound(league1Id);
      roundService.generateRound(league1Id);
      const league1Round3 = roundService.generateRound(league1Id);

      // Setup league 2 with 1 round
      playerService.addPlayer(league2Id, 'Player 2');
      courtService.addCourt(league2Id, 'Court 2');
      const league2Round1 = roundService.generateRound(league2Id);

      const league1Current = roundService.getCurrentRound(league1Id);
      const league2Current = roundService.getCurrentRound(league2Id);

      expect(league1Current).toEqual(league1Round3);
      expect(league1Current.roundNumber).toBe(3);
      
      expect(league2Current).toEqual(league2Round1);
      expect(league2Current.roundNumber).toBe(1);
    });
  });

  describe('round history preservation', () => {
    it('should preserve previous round data when creating new rounds', () => {
      const leagueId = 'league1';
      
      playerService.addPlayer(leagueId, 'Player 1');
      playerService.addPlayer(leagueId, 'Player 2');
      playerService.addPlayer(leagueId, 'Player 3');
      playerService.addPlayer(leagueId, 'Player 4');
      courtService.addCourt(leagueId, 'Court 1');

      const round1 = roundService.generateRound(leagueId);
      const round1Assignments = assignmentService.getAssignments(round1.id);
      
      // Create round 2
      roundService.generateRound(leagueId);
      
      // Verify round 1 data is still intact
      const round1Retrieved = roundService.getRound(leagueId, 1);
      const round1AssignmentsRetrieved = assignmentService.getAssignments(round1.id);

      expect(round1Retrieved).toEqual(round1);
      expect(round1AssignmentsRetrieved).toEqual(round1Assignments);
    });

    it('should maintain complete assignment state for historical rounds', () => {
      const leagueId = 'league1';
      
      // Add 8 players and 2 courts
      for (let i = 1; i <= 8; i++) {
        playerService.addPlayer(leagueId, `Player ${i}`);
      }
      courtService.addCourt(leagueId, 'Court 1');
      courtService.addCourt(leagueId, 'Court 2');

      const round1 = roundService.generateRound(leagueId);
      const round1Assignments = assignmentService.getAssignments(round1.id);
      
      // Create multiple subsequent rounds
      roundService.generateRound(leagueId);
      roundService.generateRound(leagueId);
      
      // Verify round 1 assignments are still complete
      const round1AssignmentsRetrieved = assignmentService.getAssignments(round1.id);

      expect(round1AssignmentsRetrieved).toEqual(round1Assignments);
      expect(round1AssignmentsRetrieved.length).toBe(2); // 8 players / 4 per court = 2 courts
      
      // Verify each assignment has complete team data
      round1AssignmentsRetrieved.forEach(assignment => {
        expect(assignment.team1PlayerIds).toHaveLength(2);
        expect(assignment.team2PlayerIds).toHaveLength(2);
        expect(assignment.courtId).toBeDefined();
        expect(assignment.roundId).toBe(round1.id);
      });
    });
  });
});
