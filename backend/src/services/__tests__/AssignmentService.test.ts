import { AssignmentService } from '../AssignmentService';
import { dataStore } from '../../data/DataStore';
import { Player } from '../../models/Player';
import { Court } from '../../models/Court';

describe('AssignmentService', () => {
  let service: AssignmentService;
  const leagueId = 'test-league-1';
  const roundId = 'test-round-1';

  beforeEach(() => {
    service = new AssignmentService();
    dataStore.clear();
  });

  describe('generateAssignments', () => {
    it('should generate assignments for 8 players and 2 courts', () => {
      // Create test data
      const players: Player[] = [];
      for (let i = 1; i <= 8; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      // Store courts in dataStore for sorting
      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments
      const assignments = service.generateAssignments(players, courts, roundId);

      // Verify results
      expect(assignments).toHaveLength(2);
      expect(assignments[0].team1PlayerIds).toHaveLength(2);
      expect(assignments[0].team2PlayerIds).toHaveLength(2);
      expect(assignments[1].team1PlayerIds).toHaveLength(2);
      expect(assignments[1].team2PlayerIds).toHaveLength(2);

      // Verify all players are assigned
      const allAssignedPlayerIds = [
        ...assignments[0].team1PlayerIds,
        ...assignments[0].team2PlayerIds,
        ...assignments[1].team1PlayerIds,
        ...assignments[1].team2PlayerIds
      ];
      expect(allAssignedPlayerIds).toHaveLength(8);
      expect(new Set(allAssignedPlayerIds).size).toBe(8); // All unique
    });

    it('should handle 9 players and 2 courts with overflow', () => {
      // Create test data
      const players: Player[] = [];
      for (let i = 1; i <= 9; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments
      const assignments = service.generateAssignments(players, courts, roundId);

      // Should only create 2 assignments (8 players), 1 player has bye
      expect(assignments).toHaveLength(2);

      // Verify 8 players are assigned
      const allAssignedPlayerIds = [
        ...assignments[0].team1PlayerIds,
        ...assignments[0].team2PlayerIds,
        ...assignments[1].team1PlayerIds,
        ...assignments[1].team2PlayerIds
      ];
      expect(allAssignedPlayerIds).toHaveLength(8);
    });

    it('should handle 1 player and 1 court', () => {
      const players: Player[] = [
        { id: 'player-1', leagueId, name: 'Player 1', createdAt: new Date() }
      ];

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments
      const assignments = service.generateAssignments(players, courts, roundId);

      // Should create no assignments (not enough players for a full court)
      expect(assignments).toHaveLength(0);
    });

    it('should throw error when no players are provided', () => {
      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      expect(() => {
        service.generateAssignments([], courts, roundId);
      }).toThrow('Cannot generate assignments: no players available');
    });

    it('should throw error when no courts are provided', () => {
      const players: Player[] = [
        { id: 'player-1', leagueId, name: 'Player 1', createdAt: new Date() }
      ];

      expect(() => {
        service.generateAssignments(players, [], roundId);
      }).toThrow('Cannot generate assignments: no courts available');
    });

    it('should create different assignments on multiple runs due to shuffling', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 8; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate multiple assignments
      const results = new Set<string>();
      for (let i = 0; i < 10; i++) {
        dataStore.clear();
        courts.forEach(court => dataStore.createCourt(court));
        
        const assignments = service.generateAssignments(players, courts, `round-${i}`);
        const signature = JSON.stringify(assignments.map(a => ({
          team1: a.team1PlayerIds.sort(),
          team2: a.team2PlayerIds.sort()
        })));
        results.add(signature);
      }

      // Should produce different results (probabilistic test)
      expect(results.size).toBeGreaterThan(1);
    });

    it('should assign players to correct round', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 4; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      const assignments = service.generateAssignments(players, courts, roundId);

      expect(assignments).toHaveLength(1);
      expect(assignments[0].roundId).toBe(roundId);
    });

    it('should assign players to correct court', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 4; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      const assignments = service.generateAssignments(players, courts, roundId);

      expect(assignments).toHaveLength(1);
      expect(assignments[0].courtId).toBe('court-1');
    });

    it('should split players evenly into two teams', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 4; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      const assignments = service.generateAssignments(players, courts, roundId);

      expect(assignments).toHaveLength(1);
      expect(assignments[0].team1PlayerIds).toHaveLength(2);
      expect(assignments[0].team2PlayerIds).toHaveLength(2);
    });

    it('should handle custom players per court', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 6; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Use 6 players per court (3v3)
      const assignments = service.generateAssignments(players, courts, roundId, 6);

      expect(assignments).toHaveLength(1);
      expect(assignments[0].team1PlayerIds).toHaveLength(3);
      expect(assignments[0].team2PlayerIds).toHaveLength(3);
    });
  });

  describe('getAssignments', () => {
    it('should retrieve assignments for a specific round', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 8; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments
      service.generateAssignments(players, courts, roundId);

      // Retrieve assignments
      const retrieved = service.getAssignments(roundId);

      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].roundId).toBe(roundId);
      expect(retrieved[1].roundId).toBe(roundId);
    });

    it('should return empty array for round with no assignments', () => {
      const retrieved = service.getAssignments('non-existent-round');
      expect(retrieved).toEqual([]);
    });

    it('should sort assignments by court identifier', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 12; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-3', leagueId, identifier: 'Court 3', createdAt: new Date() },
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments
      service.generateAssignments(players, courts, roundId);

      // Retrieve assignments
      const retrieved = service.getAssignments(roundId);

      expect(retrieved).toHaveLength(3);
      
      // Verify sorted order
      const court1 = dataStore.getCourt(retrieved[0].courtId);
      const court2 = dataStore.getCourt(retrieved[1].courtId);
      const court3 = dataStore.getCourt(retrieved[2].courtId);
      
      expect(court1?.identifier).toBe('Court 1');
      expect(court2?.identifier).toBe('Court 2');
      expect(court3?.identifier).toBe('Court 3');
    });

    it('should only return assignments for the specified round', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 8; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments for two different rounds
      service.generateAssignments(players, courts, 'round-1');
      service.generateAssignments(players, courts, 'round-2');

      // Retrieve assignments for round 1
      const round1Assignments = service.getAssignments('round-1');
      expect(round1Assignments).toHaveLength(2);
      expect(round1Assignments.every(a => a.roundId === 'round-1')).toBe(true);

      // Retrieve assignments for round 2
      const round2Assignments = service.getAssignments('round-2');
      expect(round2Assignments).toHaveLength(2);
      expect(round2Assignments.every(a => a.roundId === 'round-2')).toBe(true);
    });

    it('should generate different team compositions when previous assignments are provided', () => {
      // Create test data
      const players: Player[] = [];
      for (let i = 1; i <= 8; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate first round assignments
      const round1Assignments = service.generateAssignments(
        players,
        courts,
        'round-1'
      );

      // Clear dataStore to generate new assignments
      dataStore.clear();
      courts.forEach(court => dataStore.createCourt(court));

      // Generate second round assignments with previous assignments
      const round2Assignments = service.generateAssignments(
        players,
        courts,
        'round-2',
        4,
        round1Assignments
      );

      // Extract teams from both rounds
      const round1Teams = [
        [...round1Assignments[0].team1PlayerIds].sort(),
        [...round1Assignments[0].team2PlayerIds].sort(),
        [...round1Assignments[1].team1PlayerIds].sort(),
        [...round1Assignments[1].team2PlayerIds].sort()
      ];

      const round2Teams = [
        [...round2Assignments[0].team1PlayerIds].sort(),
        [...round2Assignments[0].team2PlayerIds].sort(),
        [...round2Assignments[1].team1PlayerIds].sort(),
        [...round2Assignments[1].team2PlayerIds].sort()
      ];

      // Check that at least one team is different
      let foundDifference = false;
      for (const round2Team of round2Teams) {
        const existsInRound1 = round1Teams.some(round1Team =>
          round1Team.length === round2Team.length &&
          round1Team.every((id, idx) => id === round2Team[idx])
        );
        if (!existsInRound1) {
          foundDifference = true;
          break;
        }
      }

      expect(foundDifference).toBe(true);
    });

    it('should re-shuffle if initial assignment matches previous round', () => {
      // Create a small set of players where identical assignments are more likely
      const players: Player[] = [];
      for (let i = 1; i <= 4; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate first round with specific team composition
      const round1Assignments = service.generateAssignments(
        players,
        courts,
        'round-1'
      );

      // Try multiple times to ensure variety logic works
      let allDifferent = true;
      for (let i = 0; i < 5; i++) {
        dataStore.clear();
        courts.forEach(court => dataStore.createCourt(court));

        const newAssignments = service.generateAssignments(
          players,
          courts,
          `round-${i + 2}`,
          4,
          round1Assignments
        );

        // Check if teams are identical
        const round1Team1 = [...round1Assignments[0].team1PlayerIds].sort();
        const round1Team2 = [...round1Assignments[0].team2PlayerIds].sort();
        const newTeam1 = [...newAssignments[0].team1PlayerIds].sort();
        const newTeam2 = [...newAssignments[0].team2PlayerIds].sort();

        const team1Match = round1Team1.every((id, idx) => id === newTeam1[idx]);
        const team2Match = round1Team2.every((id, idx) => id === newTeam2[idx]);

        if (team1Match && team2Match) {
          allDifferent = false;
          break;
        }
      }

      // With the variety logic, we should not get identical assignments
      expect(allDifferent).toBe(true);
    });

    it('should work correctly when no previous assignments are provided', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 8; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments without previous assignments
      const assignments = service.generateAssignments(
        players,
        courts,
        roundId,
        4,
        undefined
      );

      expect(assignments).toHaveLength(2);
      expect(assignments[0].team1PlayerIds).toHaveLength(2);
      expect(assignments[0].team2PlayerIds).toHaveLength(2);
    });

    it('should work correctly when previous assignments is empty array', () => {
      const players: Player[] = [];
      for (let i = 1; i <= 8; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
        { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      // Generate assignments with empty previous assignments
      const assignments = service.generateAssignments(
        players,
        courts,
        roundId,
        4,
        []
      );

      expect(assignments).toHaveLength(2);
      expect(assignments[0].team1PlayerIds).toHaveLength(2);
      expect(assignments[0].team2PlayerIds).toHaveLength(2);
    });

    it('should handle case where all players form same teams regardless of shuffle', () => {
      // With only 4 players and 1 court, there are limited team combinations
      // This test ensures the algorithm doesn't get stuck in an infinite loop
      const players: Player[] = [];
      for (let i = 1; i <= 4; i++) {
        players.push({
          id: `player-${i}`,
          leagueId,
          name: `Player ${i}`,
          createdAt: new Date()
        });
      }

      const courts: Court[] = [
        { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() }
      ];

      courts.forEach(court => dataStore.createCourt(court));

      const round1Assignments = service.generateAssignments(
        players,
        courts,
        'round-1'
      );

      dataStore.clear();
      courts.forEach(court => dataStore.createCourt(court));

      // This should complete without hanging (max 10 retries)
      const round2Assignments = service.generateAssignments(
        players,
        courts,
        'round-2',
        4,
        round1Assignments
      );

      // Should still produce valid assignments
      expect(round2Assignments).toHaveLength(1);
      expect(round2Assignments[0].team1PlayerIds).toHaveLength(2);
      expect(round2Assignments[0].team2PlayerIds).toHaveLength(2);
    });
  });

  describe('reassignPlayers', () => {
  it('should update specified assignments while preserving others', () => {
    // Create test data
    const players: Player[] = [];
    for (let i = 1; i <= 8; i++) {
      const player = {
        id: `player-${i}`,
        leagueId,
        name: `Player ${i}`,
        createdAt: new Date()
      };
      players.push(player);
      dataStore.createPlayer(player);
    }

    const courts: Court[] = [
      { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
      { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() }
    ];

    courts.forEach(court => dataStore.createCourt(court));

    // Generate initial assignments
    const initialAssignments = service.generateAssignments(players, courts, roundId);
    expect(initialAssignments).toHaveLength(2);

    // Manually reassign only court-1
    const manualAssignments = [{
      courtId: 'court-1',
      team1PlayerIds: ['player-1', 'player-2'],
      team2PlayerIds: ['player-3', 'player-4']
    }];

    const updatedAssignments = service.reassignPlayers(roundId, manualAssignments);

    // Verify court-1 was updated
    const court1Assignment = updatedAssignments.find(a => a.courtId === 'court-1');
    expect(court1Assignment?.team1PlayerIds).toEqual(['player-1', 'player-2']);
    expect(court1Assignment?.team2PlayerIds).toEqual(['player-3', 'player-4']);

    // Verify court-2 was preserved
    const court2Assignment = updatedAssignments.find(a => a.courtId === 'court-2');
    expect(court2Assignment).toBeDefined();
    expect(court2Assignment?.courtId).toBe('court-2');
  });

  it('should throw error for invalid court reference', () => {
    const manualAssignments = [{
      courtId: 'non-existent-court',
      team1PlayerIds: ['player-1', 'player-2'],
      team2PlayerIds: ['player-3', 'player-4']
    }];

    expect(() => {
      service.reassignPlayers(roundId, manualAssignments);
    }).toThrow('Court not found: non-existent-court');
  });

  it('should throw error for invalid player reference', () => {
    const court = { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() };
    dataStore.createCourt(court);

    const manualAssignments = [{
      courtId: 'court-1',
      team1PlayerIds: ['non-existent-player', 'player-2'],
      team2PlayerIds: ['player-3', 'player-4']
    }];

    expect(() => {
      service.reassignPlayers(roundId, manualAssignments);
    }).toThrow('Player not found: non-existent-player');
  });

  it('should create new assignment if none exists for the court', () => {
    // Create test data
    const players: Player[] = [];
    for (let i = 1; i <= 4; i++) {
      const player = {
        id: `player-${i}`,
        leagueId,
        name: `Player ${i}`,
        createdAt: new Date()
      };
      players.push(player);
      dataStore.createPlayer(player);
    }

    const court = { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() };
    dataStore.createCourt(court);

    // Create round without generating assignments
    const round = {
      id: roundId,
      leagueId,
      roundNumber: 1,
      createdAt: new Date()
    };
    dataStore.createRound(round);

    // Manually create assignment for a court that has no existing assignment
    const manualAssignments = [{
      courtId: 'court-1',
      team1PlayerIds: ['player-1', 'player-2'],
      team2PlayerIds: ['player-3', 'player-4']
    }];

    const assignments = service.reassignPlayers(roundId, manualAssignments);

    expect(assignments).toHaveLength(1);
    expect(assignments[0].courtId).toBe('court-1');
    expect(assignments[0].team1PlayerIds).toEqual(['player-1', 'player-2']);
    expect(assignments[0].team2PlayerIds).toEqual(['player-3', 'player-4']);
  });

  it('should update multiple assignments at once', () => {
    // Create test data
    const players: Player[] = [];
    for (let i = 1; i <= 12; i++) {
      const player = {
        id: `player-${i}`,
        leagueId,
        name: `Player ${i}`,
        createdAt: new Date()
      };
      players.push(player);
      dataStore.createPlayer(player);
    }

    const courts: Court[] = [
      { id: 'court-1', leagueId, identifier: 'Court 1', createdAt: new Date() },
      { id: 'court-2', leagueId, identifier: 'Court 2', createdAt: new Date() },
      { id: 'court-3', leagueId, identifier: 'Court 3', createdAt: new Date() }
    ];

    courts.forEach(court => dataStore.createCourt(court));

    // Generate initial assignments
    service.generateAssignments(players, courts, roundId);

    // Manually reassign all courts
    const manualAssignments = [
      {
        courtId: 'court-1',
        team1PlayerIds: ['player-1', 'player-2'],
        team2PlayerIds: ['player-3', 'player-4']
      },
      {
        courtId: 'court-2',
        team1PlayerIds: ['player-5', 'player-6'],
        team2PlayerIds: ['player-7', 'player-8']
      },
      {
        courtId: 'court-3',
        team1PlayerIds: ['player-9', 'player-10'],
        team2PlayerIds: ['player-11', 'player-12']
      }
    ];

    const updatedAssignments = service.reassignPlayers(roundId, manualAssignments);

    expect(updatedAssignments).toHaveLength(3);

    // Verify all assignments were updated
    const court1 = updatedAssignments.find(a => a.courtId === 'court-1');
    expect(court1?.team1PlayerIds).toEqual(['player-1', 'player-2']);

    const court2 = updatedAssignments.find(a => a.courtId === 'court-2');
    expect(court2?.team1PlayerIds).toEqual(['player-5', 'player-6']);

    const court3 = updatedAssignments.find(a => a.courtId === 'court-3');
    expect(court3?.team1PlayerIds).toEqual(['player-9', 'player-10']);
  });
});
});
