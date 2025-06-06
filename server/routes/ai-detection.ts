import express from 'express';
import { AIDetectionService } from '../services/ai-detection-service';
import { authenticateJWT } from '../auth';
import { z } from 'zod';

const router = express.Router();

// Schema for detection request
const runDetectionSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters long")
});

// Run AI detection shield on content
router.post('/run', authenticateJWT, async (req, res) => {
  try {
    const { content } = runDetectionSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await AIDetectionService.runDetectionShield(userId, content);
    
    // Log AI detection event for launch monitoring
    const { LaunchMonitoring } = await import('../utils/launch-monitoring');
    LaunchMonitoring.aiDetectionRun(userId, content.length);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI Detection Shield error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Detection failed'
    });
  }
});

// Get user's detection history
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.id;
    const history = await AIDetectionService.getUserDetectionHistory(userId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get detection history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve detection history'
    });
  }
});

// Get specific detection run
router.get('/run/:runId', authenticateJWT, async (req, res) => {
  try {
    const runId = parseInt(req.params.runId);
    const userId = req.user!.id;
    
    if (isNaN(runId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid run ID'
      });
    }

    const run = await AIDetectionService.getDetectionRun(runId, userId);
    
    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Detection run not found'
      });
    }
    
    res.json({
      success: true,
      data: run
    });
  } catch (error) {
    console.error('Get detection run error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve detection run'
    });
  }
});

// Re-run detection on existing content
router.post('/rerun/:runId', authenticateJWT, async (req, res) => {
  try {
    const runId = parseInt(req.params.runId);
    const userId = req.user!.id;
    
    if (isNaN(runId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid run ID'
      });
    }

    // Get the original run to extract content
    const originalRun = await AIDetectionService.getDetectionRun(runId, userId);
    
    if (!originalRun) {
      return res.status(404).json({
        success: false,
        error: 'Original detection run not found'
      });
    }

    // Run detection again with the same content
    const result = await AIDetectionService.runDetectionShield(userId, originalRun.contentText);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Re-run detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to re-run detection'
    });
  }
});

export default router;