import { Router, Request, Response } from 'express';
import { dataStore } from '../data/DataStore';
import { leagueService } from '../services/LeagueService';
import { playerService } from '../services/PlayerService';
import { courtService } from '../services/CourtService';
import { LeagueFormat } from '../models/League';

const router = Router();

/**
 * POST /api/dev/seed
 * Seed the database with mock data for testing
 */
router.post('/dev/seed', (req: Request, res: Response) => {
  try {
    // Clear existing data first
    dataStore.clear();
    leagueService.clearSelection();

    // Create a test league
    const league = leagueService.createLeague('Test League', LeagueFormat.ROUND_ROBIN);

    // Add mock players
    const playerNames = [
      'Chinmay',
      'Umar',
      'Glancy',
      'Maria',
      'Jim',
      'John Foey',
      'Pam C',
      'Paul C',
      'Paul',
      'Lynne',
      'Shiba',
      'Amar',
      'Aditya',
      'Bob',
      'Serina',
      'Jamie',
      'Carl Diaz',
      'Angela Evans',
      'Linda',
      'Claudia',
      'Sebastian',
      'Arlo',
      'Dennis',
      'Dawn',
      'Steve',
      'Douglas'
    ];

    const players = playerNames.map(name => 
      playerService.addPlayer(league.id, name)
    );

    // Add mock courts
    const courtIdentifiers = ['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Court 5', 'Court 6'];
    const courts = courtIdentifiers.map(identifier =>
      courtService.addCourt(league.id, identifier)
    );

    res.json({
      message: 'Mock data seeded successfully',
      data: {
        league,
        players: players.length,
        courts: courts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to seed mock data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});


/**
 * POST /api/dev/clear
 * Clear all data from the database
 */
router.post('/dev/clear', (req: Request, res: Response) => {
  try {
    dataStore.clear();
    leagueService.clearSelection();

    res.json({
      message: 'All data cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to clear data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
