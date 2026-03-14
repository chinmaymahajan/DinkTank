import { Router, Request, Response } from 'express';
import { courtService } from '../services/CourtService';

const router = Router();

/**
 * POST /api/leagues/:leagueId/courts
 * Add a new court to a league
 */
router.post('/leagues/:leagueId/courts', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    const { identifier } = req.body;
    
    if (identifier === undefined || identifier === null || typeof identifier !== 'string') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Court identifier is required and must be a string'
        }
      });
    }

    const court = courtService.addCourt(leagueId, identifier);
    res.status(201).json(court);
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
        message: 'Failed to add court',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/leagues/:leagueId/courts
 * Get all courts for a specific league
 */
router.get('/leagues/:leagueId/courts', (req: Request, res: Response) => {
  try {
    const { leagueId } = req.params;
    const courts = courtService.getCourts(leagueId);
    res.json(courts);
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get courts',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
