import { dataStore } from '../DataStore';
import { League, LeagueFormat } from '../../models/League';
import { Player } from '../../models/Player';
import { Court } from '../../models/Court';
import { Round } from '../../models/Round';
import { Assignment } from '../../models/Assignment';

describe('DataStore', () => {
  beforeEach(() => {
    dataStore.clear();
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = dataStore.generateId();
      const id2 = dataStore.generateId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^id_\d+_\d+$/);
      expect(id2).toMatch(/^id_\d+_\d+$/);
    });
  });

  describe('League CRUD', () => {
    it('should create and retrieve a league', () => {
      const league: League = {
        id: dataStore.generateId(),
        name: 'Test League',
        format: LeagueFormat.ROUND_ROBIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dataStore.createLeague(league);
      const retrieved = dataStore.getLeague(league.id);

      expect(retrieved).toEqual(league);
    });

    it('should get all leagues', () => {
      const league1: League = {
        id: dataStore.generateId(),
        name: 'League 1',
        format: LeagueFormat.ROUND_ROBIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const league2: League = {
        id: dataStore.generateId(),
        name: 'League 2',
        format: LeagueFormat.ROUND_ROBIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dataStore.createLeague(league1);
      dataStore.createLeague(league2);

      const all = dataStore.getAllLeagues();
      expect(all).toHaveLength(2);
      expect(all).toContainEqual(league1);
      expect(all).toContainEqual(league2);
    });

    it('should update a league', () => {
      const league: League = {
        id: dataStore.generateId(),
        name: 'Original Name',
        format: LeagueFormat.ROUND_ROBIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dataStore.createLeague(league);
      const updated = dataStore.updateLeague(league.id, { name: 'Updated Name' });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.id).toBe(league.id);
    });

    it('should delete a league', () => {
      const league: League = {
        id: dataStore.generateId(),
        name: 'Test League',
        format: LeagueFormat.ROUND_ROBIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dataStore.createLeague(league);
      const deleted = dataStore.deleteLeague(league.id);
      const retrieved = dataStore.getLeague(league.id);

      expect(deleted).toBe(true);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Player CRUD', () => {
    it('should create and retrieve a player', () => {
      const player: Player = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        name: 'John Doe',
        createdAt: new Date()
      };

      dataStore.createPlayer(player);
      const retrieved = dataStore.getPlayer(player.id);

      expect(retrieved).toEqual(player);
    });

    it('should get players by league', () => {
      const player1: Player = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        name: 'Player 1',
        createdAt: new Date()
      };
      const player2: Player = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        name: 'Player 2',
        createdAt: new Date()
      };
      const player3: Player = {
        id: dataStore.generateId(),
        leagueId: 'league2',
        name: 'Player 3',
        createdAt: new Date()
      };

      dataStore.createPlayer(player1);
      dataStore.createPlayer(player2);
      dataStore.createPlayer(player3);

      const league1Players = dataStore.getPlayersByLeague('league1');
      expect(league1Players).toHaveLength(2);
      expect(league1Players).toContainEqual(player1);
      expect(league1Players).toContainEqual(player2);
    });
  });

  describe('Court CRUD', () => {
    it('should create and retrieve a court', () => {
      const court: Court = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        identifier: 'Court 1',
        createdAt: new Date()
      };

      dataStore.createCourt(court);
      const retrieved = dataStore.getCourt(court.id);

      expect(retrieved).toEqual(court);
    });

    it('should get courts by league', () => {
      const court1: Court = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        identifier: 'Court 1',
        createdAt: new Date()
      };
      const court2: Court = {
        id: dataStore.generateId(),
        leagueId: 'league2',
        identifier: 'Court 2',
        createdAt: new Date()
      };

      dataStore.createCourt(court1);
      dataStore.createCourt(court2);

      const league1Courts = dataStore.getCourtsByLeague('league1');
      expect(league1Courts).toHaveLength(1);
      expect(league1Courts).toContainEqual(court1);
    });
  });

  describe('Round CRUD', () => {
    it('should create and retrieve a round', () => {
      const round: Round = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        roundNumber: 1,
        createdAt: new Date()
      };

      dataStore.createRound(round);
      const retrieved = dataStore.getRound(round.id);

      expect(retrieved).toEqual(round);
    });

    it('should get rounds by league in sorted order', () => {
      const round1: Round = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        roundNumber: 2,
        createdAt: new Date()
      };
      const round2: Round = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        roundNumber: 1,
        createdAt: new Date()
      };
      const round3: Round = {
        id: dataStore.generateId(),
        leagueId: 'league1',
        roundNumber: 3,
        createdAt: new Date()
      };

      dataStore.createRound(round1);
      dataStore.createRound(round2);
      dataStore.createRound(round3);

      const rounds = dataStore.getRoundsByLeague('league1');
      expect(rounds).toHaveLength(3);
      expect(rounds[0].roundNumber).toBe(1);
      expect(rounds[1].roundNumber).toBe(2);
      expect(rounds[2].roundNumber).toBe(3);
    });
  });

  describe('Assignment CRUD', () => {
    it('should create and retrieve an assignment', () => {
      const assignment: Assignment = {
        id: dataStore.generateId(),
        roundId: 'round1',
        courtId: 'court1',
        team1PlayerIds: ['player1', 'player2'],
        team2PlayerIds: ['player3', 'player4'],
        createdAt: new Date()
      };

      dataStore.createAssignment(assignment);
      const retrieved = dataStore.getAssignment(assignment.id);

      expect(retrieved).toEqual(assignment);
    });

    it('should get assignments by round', () => {
      const assignment1: Assignment = {
        id: dataStore.generateId(),
        roundId: 'round1',
        courtId: 'court1',
        team1PlayerIds: ['player1', 'player2'],
        team2PlayerIds: ['player3', 'player4'],
        createdAt: new Date()
      };
      const assignment2: Assignment = {
        id: dataStore.generateId(),
        roundId: 'round1',
        courtId: 'court2',
        team1PlayerIds: ['player5', 'player6'],
        team2PlayerIds: ['player7', 'player8'],
        createdAt: new Date()
      };
      const assignment3: Assignment = {
        id: dataStore.generateId(),
        roundId: 'round2',
        courtId: 'court1',
        team1PlayerIds: ['player1', 'player3'],
        team2PlayerIds: ['player2', 'player4'],
        createdAt: new Date()
      };

      dataStore.createAssignment(assignment1);
      dataStore.createAssignment(assignment2);
      dataStore.createAssignment(assignment3);

      const round1Assignments = dataStore.getAssignmentsByRound('round1');
      expect(round1Assignments).toHaveLength(2);
      expect(round1Assignments).toContainEqual(assignment1);
      expect(round1Assignments).toContainEqual(assignment2);
    });
  });

  describe('Clear', () => {
    it('should clear all data', () => {
      const league: League = {
        id: dataStore.generateId(),
        name: 'Test League',
        format: LeagueFormat.ROUND_ROBIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const player: Player = {
        id: dataStore.generateId(),
        leagueId: league.id,
        name: 'Test Player',
        createdAt: new Date()
      };

      dataStore.createLeague(league);
      dataStore.createPlayer(player);

      dataStore.clear();

      expect(dataStore.getAllLeagues()).toHaveLength(0);
      expect(dataStore.getAllPlayers()).toHaveLength(0);
    });
  });
});
