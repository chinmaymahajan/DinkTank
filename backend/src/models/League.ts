/**
 * Available league formats
 */
export enum LeagueFormat {
  ROUND_ROBIN = 'round_robin',
  // Future formats can be added here
  // SINGLE_ELIMINATION = 'single_elimination',
  // DOUBLE_ELIMINATION = 'double_elimination',
}

/**
 * League entity representing a pickleball league
 */
export interface League {
  id: string;
  name: string;
  format: LeagueFormat;
  createdAt: Date;
  updatedAt: Date;
}
