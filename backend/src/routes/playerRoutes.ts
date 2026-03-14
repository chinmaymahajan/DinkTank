import { Router, Request, Response } from 'express';
import { playerService } from '../services/PlayerService';

const router = Router();

/**
 * POST /api/leagues/:leagueId/players
 * Add a new player to a league
 */
router.post('/leagues/:leagueId/players', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    const { name } = req.body;
    
    if (name === undefined || name === null || typeof name !== 'string') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Player name is required and must be a string'
        }
      });
    }

    const player = playerService.addPlayer(leagueId, name);
    res.status(201).json(player);
  } catch (error) {
    if (error instanceof Error && error.message.includes('cannot be empty')) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add player',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues/:leagueId/players
 * Get all players for a specific league
 */
router.get('/leagues/:leagueId/players', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    const players = playerService.getPlayers(leagueId);
    res.json(players);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get players',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
