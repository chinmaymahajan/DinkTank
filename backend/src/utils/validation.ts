/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a player name
 * Rejects empty or whitespace-only strings
 * 
 * @param name - The player name to validate
 * @returns ValidationResult indicating if the name is valid
 */
export function validatePlayerName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      error: 'Player name cannot be empty'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates a court identifier
 * Rejects empty or whitespace-only strings
 * 
 * @param identifier - The court identifier to validate
 * @returns ValidationResult indicating if the identifier is valid
 */
export function validateCourtIdentifier(identifier: string): ValidationResult {
  if (!identifier || identifier.trim().length === 0) {
    return {
      isValid: false,
      error: 'Court identifier cannot be empty'
    };
  }
  
  return { isValid: true };
}
