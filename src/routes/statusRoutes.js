const express = require('express');
const router = express.Router();
const ProcessingRequest = require('../models/ProcessingRequest');

/**
 * @swagger
 * /api/status/{requestId}:
 *   get:
 *     summary: Get processing status
 *     description: Returns the current status of image processing for a given requestId
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the processing request
 *     responses:
 *       200:
 *         description: Processing status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [pending, processing, completed, failed]
 *                 progress:
 *                   type: number
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.get('/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Find the processing request in the database
        const request = await ProcessingRequest.findOne({ requestId });
        
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({
            requestId: request.requestId,
            status: request.status,
            progress: request.progress,
            completedAt: request.completedAt,
            error: request.error
        });

    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 