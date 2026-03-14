import { courtService } from '../CourtService';
import { dataStore } from '../../data/DataStore';

describe('CourtService', () => {
  beforeEach(() => {
    dataStore.clear();
  });

  describe('addCourt', () => {
    it('should add a court with a valid identifier', () => {
      const leagueId = 'league1';
      const courtIdentifier = 'Court 1';

      const court = courtService.addCourt(leagueId, courtIdentifier);

      expect(court).toBeDefined();
      expect(court.id).toBeDefined();
      expect(court.leagueId).toBe(leagueId);
      expect(court.identifier).toBe(courtIdentifier);
      expect(court.createdAt).toBeInstanceOf(Date);
    });

    it('should trim whitespace from court identifier', () => {
      const leagueId = 'league1';
      const courtIdentifier = '  Court A  ';

      const court = courtService.addCourt(leagueId, courtIdentifier);

      expect(court.identifier).toBe('Court A');
    });

    it('should throw error for empty court identifier', () => {
      const leagueId = 'league1';

      expect(() => {
        courtService.addCourt(leagueId, '');
      }).toThrow('Court identifier cannot be empty');
    });

    it('should throw error for whitespace-only court identifier', () => {
      const leagueId = 'league1';

      expect(() => {
        courtService.addCourt(leagueId, '   ');
      }).toThrow('Court identifier cannot be empty');
    });

    it('should store court in data store', () => {
      const leagueId = 'league1';
      const courtIdentifier = 'Court 2';

      const court = courtService.addCourt(leagueId, courtIdentifier);
      const retrieved = dataStore.getCourt(court.id);

      expect(retrieved).toEqual(court);
    });

    it('should allow multiple courts with different identifiers', () => {
      const leagueId = 'league1';

      const court1 = courtService.addCourt(leagueId, 'Court 1');
      const court2 = courtService.addCourt(leagueId, 'Court 2');
      const court3 = courtService.addCourt(leagueId, 'Court 3');

      expect(court1.id).not.toBe(court2.id);
      expect(court2.id).not.toBe(court3.id);
      expect(court1.id).not.toBe(court3.id);
    });
  });

  describe('getCourts', () => {
    it('should return empty array when no courts exist', () => {
      const courts = courtService.getCourts('league1');

      expect(courts).toEqual([]);
    });

    it('should return all courts for a specific league', () => {
      const leagueId = 'league1';

      const court1 = courtService.addCourt(leagueId, 'Court 1');
      const court2 = courtService.addCourt(leagueId, 'Court 2');
      const court3 = courtService.addCourt(leagueId, 'Court 3');

      const courts = courtService.getCourts(leagueId);

      expect(courts).toHaveLength(3);
      expect(courts).toContainEqual(court1);
      expect(courts).toContainEqual(court2);
      expect(courts).toContainEqual(court3);
    });

    it('should return only courts for the specified league', () => {
      const league1Id = 'league1';
      const league2Id = 'league2';

      const court1 = courtService.addCourt(league1Id, 'League 1 Court 1');
      const court2 = courtService.addCourt(league1Id, 'League 1 Court 2');
      const court3 = courtService.addCourt(league2Id, 'League 2 Court 1');

      const league1Courts = courtService.getCourts(league1Id);
      const league2Courts = courtService.getCourts(league2Id);

      expect(league1Courts).toHaveLength(2);
      expect(league1Courts).toContainEqual(court1);
      expect(league1Courts).toContainEqual(court2);
      expect(league1Courts).not.toContainEqual(court3);

      expect(league2Courts).toHaveLength(1);
      expect(league2Courts).toContainEqual(court3);
      expect(league2Courts).not.toContainEqual(court1);
    });

    it('should return empty array for league with no courts', () => {
      courtService.addCourt('league1', 'Court 1');
      
      const courts = courtService.getCourts('league2');

      expect(courts).toEqual([]);
    });
  });

  describe('validateCourtIdentifier', () => {
    it('should return valid for non-empty identifier', () => {
      const result = courtService.validateCourtIdentifier('Court 1');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty identifier', () => {
      const result = courtService.validateCourtIdentifier('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Court identifier cannot be empty');
    });

    it('should return invalid for whitespace-only identifier', () => {
      const result = courtService.validateCourtIdentifier('   ');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Court identifier cannot be empty');
    });
  });
});
