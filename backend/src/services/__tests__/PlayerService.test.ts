import { playerService } from '../PlayerService';
import { dataStore } from '../../data/DataStore';

describe('PlayerService', () => {
  beforeEach(() => {
    dataStore.clear();
  });

  describe('addPlayer', () => {
    it('should add a player with a valid name', () => {
      const leagueId = 'league1';
      const playerName = 'John Doe';

      const player = playerService.addPlayer(leagueId, playerName);

      expect(player).toBeDefined();
      expect(player.id).toBeDefined();
      expect(player.leagueId).toBe(leagueId);
      expect(player.name).toBe(playerName);
      expect(player.createdAt).toBeInstanceOf(Date);
    });

    it('should trim whitespace from player name', () => {
      const leagueId = 'league1';
      const playerName = '  Jane Smith  ';

      const player = playerService.addPlayer(leagueId, playerName);

      expect(player.name).toBe('Jane Smith');
    });

    it('should throw error for empty player name', () => {
      const leagueId = 'league1';

      expect(() => {
        playerService.addPlayer(leagueId, '');
      }).toThrow('Player name cannot be empty');
    });

    it('should throw error for whitespace-only player name', () => {
      const leagueId = 'league1';

      expect(() => {
        playerService.addPlayer(leagueId, '   ');
      }).toThrow('Player name cannot be empty');
    });

    it('should store player in data store', () => {
      const leagueId = 'league1';
      const playerName = 'Alice Johnson';

      const player = playerService.addPlayer(leagueId, playerName);
      const retrieved = dataStore.getPlayer(player.id);

      expect(retrieved).toEqual(player);
    });

    it('should allow multiple players with different names', () => {
      const leagueId = 'league1';

      const player1 = playerService.addPlayer(leagueId, 'Player 1');
      const player2 = playerService.addPlayer(leagueId, 'Player 2');
      const player3 = playerService.addPlayer(leagueId, 'Player 3');

      expect(player1.id).not.toBe(player2.id);
      expect(player2.id).not.toBe(player3.id);
      expect(player1.id).not.toBe(player3.id);
    });
  });

  describe('getPlayers', () => {
    it('should return empty array when no players exist', () => {
      const players = playerService.getPlayers('league1');

      expect(players).toEqual([]);
    });

    it('should return all players for a specific league', () => {
      const leagueId = 'league1';

      const player1 = playerService.addPlayer(leagueId, 'Player 1');
      const player2 = playerService.addPlayer(leagueId, 'Player 2');
      const player3 = playerService.addPlayer(leagueId, 'Player 3');

      const players = playerService.getPlayers(leagueId);

      expect(players).toHaveLength(3);
      expect(players).toContainEqual(player1);
      expect(players).toContainEqual(player2);
      expect(players).toContainEqual(player3);
    });

    it('should return only players for the specified league', () => {
      const league1Id = 'league1';
      const league2Id = 'league2';

      const player1 = playerService.addPlayer(league1Id, 'League 1 Player 1');
      const player2 = playerService.addPlayer(league1Id, 'League 1 Player 2');
      const player3 = playerService.addPlayer(league2Id, 'League 2 Player 1');

      const league1Players = playerService.getPlayers(league1Id);
      const league2Players = playerService.getPlayers(league2Id);

      expect(league1Players).toHaveLength(2);
      expect(league1Players).toContainEqual(player1);
      expect(league1Players).toContainEqual(player2);
      expect(league1Players).not.toContainEqual(player3);

      expect(league2Players).toHaveLength(1);
      expect(league2Players).toContainEqual(player3);
      expect(league2Players).not.toContainEqual(player1);
    });

    it('should return empty array for league with no players', () => {
      playerService.addPlayer('league1', 'Player 1');
      
      const players = playerService.getPlayers('league2');

      expect(players).toEqual([]);
    });
  });

  describe('validatePlayerName', () => {
    it('should return valid for non-empty name', () => {
      const result = playerService.validatePlayerName('John Doe');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty name', () => {
      const result = playerService.validatePlayerName('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });

    it('should return invalid for whitespace-only name', () => {
      const result = playerService.validatePlayerName('   ');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });
  });
});
