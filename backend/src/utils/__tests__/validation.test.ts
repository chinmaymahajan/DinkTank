import { validatePlayerName, validateCourtIdentifier } from '../validation';

describe('Validation Functions', () => {
  describe('validatePlayerName', () => {
    it('should accept valid player names', () => {
      const result = validatePlayerName('John Doe');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty string', () => {
      const result = validatePlayerName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const result = validatePlayerName('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });

    it('should reject string with only tabs', () => {
      const result = validatePlayerName('\t\t');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });

    it('should reject string with mixed whitespace', () => {
      const result = validatePlayerName(' \t \n ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Player name cannot be empty');
    });

    it('should accept name with leading/trailing spaces', () => {
      const result = validatePlayerName('  John Doe  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCourtIdentifier', () => {
    it('should accept valid court identifiers', () => {
      const result = validateCourtIdentifier('Court 1');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty string', () => {
      const result = validateCourtIdentifier('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Court identifier cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      const result = validateCourtIdentifier('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Court identifier cannot be empty');
    });

    it('should reject string with only tabs', () => {
      const result = validateCourtIdentifier('\t\t');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Court identifier cannot be empty');
    });

    it('should reject string with mixed whitespace', () => {
      const result = validateCourtIdentifier(' \t \n ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Court identifier cannot be empty');
    });

    it('should accept identifier with leading/trailing spaces', () => {
      const result = validateCourtIdentifier('  Court A  ');
      expect(result.isValid).toBe(true);
    });
  });
});
