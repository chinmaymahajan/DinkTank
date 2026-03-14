import { Router, Request, Response } from 'express';
import { leagueService } from '../services/LeagueService';
import { LeagueFormat } from '../models/League';

const router = Router();

/**
 * POST /api/leagues
 * Create a new league
 */
router.post('/leagues', (req: Request, res: Response) => {
  try {
    const { name, format } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'League name is required and must be a string'
        }
      });
    }

    // Validate format if provided
    if (format && !Object.values(LeagueFormat).includes(format)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid league format'
        }
      });
    }

    const league = leagueService.createLeague(name, format);
    res.status(201).json(league);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create league',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues
 * List all leagues
 */
router.get('/leagues', (req: Request, res: Response) => {
  try {
    const leagues = leagueService.listLeagues();
    res.json(leagues);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list leagues',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues/:id
 * Get a specific league by ID
 */
router.get('/leagues/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const league = leagueService.getLeague(id);
    
    if (!league) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'League not found'
        }
      });
    }

    res.json(league);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get league',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * POST /api/leagues/:id/select
 * Select a league as the active league
 */
router.post('/leagues/:id/select', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    leagueService.selectLeague(id);
    
    res.json({
      message: 'League selected successfully',
      leagueId: id
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'League not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'League not found'
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to select league',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
