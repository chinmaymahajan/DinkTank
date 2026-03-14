/**
 * Basic tests to verify data model interfaces are properly defined
 */
import { League, LeagueFormat, Player, Court, Round, Assignment, ErrorResponse } from '../index';

describe('Data Models', () => {
  describe('League', () => {
    it('should have correct structure', () => {
      const league: League = {
        id: 'league-1',
        name: 'Summer League',
        format: LeagueFormat.ROUND_ROBIN,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      expect(league.id).toBe('league-1');
      expect(league.name).toBe('Summer League');
      expect(league.format).toBe(LeagueFormat.ROUND_ROBIN);
      expect(league.createdAt).toBeInstanceOf(Date);
      expect(league.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Player', () => {
    it('should have correct structure', () => {
      const player: Player = {
        id: 'player-1',
        leagueId: 'league-1',
        name: 'John Doe',
        createdAt: new Date()
      };
      
      expect(player.id).toBe('player-1');
      expect(player.leagueId).toBe('league-1');
      expect(player.name).toBe('John Doe');
      expect(player.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Court', () => {
    it('should have correct structure', () => {
      const court: Court = {
        id: 'court-1',
        leagueId: 'league-1',
        identifier: 'Court 1',
        createdAt: new Date()
      };
      
      expect(court.id).toBe('court-1');
      expect(court.leagueId).toBe('league-1');
      expect(court.identifier).toBe('Court 1');
      expect(court.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Round', () => {
    it('should have correct structure', () => {
      const round: Round = {
        id: 'round-1',
        leagueId: 'league-1',
        roundNumber: 1,
        createdAt: new Date()
      };
      
      expect(round.id).toBe('round-1');
      expect(round.leagueId).toBe('league-1');
      expect(round.roundNumber).toBe(1);
      expect(round.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Assignment', () => {
    it('should have correct structure', () => {
      const assignment: Assignment = {
        id: 'assignment-1',
        roundId: 'round-1',
        courtId: 'court-1',
        team1PlayerIds: ['player-1', 'player-2'],
        team2PlayerIds: ['player-3', 'player-4'],
        createdAt: new Date()
      };
      
      expect(assignment.id).toBe('assignment-1');
      expect(assignment.roundId).toBe('round-1');
      expect(assignment.courtId).toBe('court-1');
      expect(assignment.team1PlayerIds).toHaveLength(2);
      expect(assignment.team2PlayerIds).toHaveLength(2);
      expect(assignment.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('ErrorResponse', () => {
    it('should have correct structure', () => {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Player name cannot be empty',
          details: { field: 'name' }
        }
      };
      
      expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
      expect(errorResponse.error.message).toBe('Player name cannot be empty');
      expect(errorResponse.error.details).toEqual({ field: 'name' });
    });
  });
});
