const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const CSVProcessor = require('../services/csvProcessor');
const ProcessingRequest = require('../models/ProcessingRequest');
const ImageProcessor = require('../services/imageProcessor');
const csvProcessor = require('../services/csvProcessor');

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a CSV file for image processing
 *     description: Accepts a CSV file containing image URLs and processes them
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csv:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to upload
 *     responses:
 *       200:
 *         description: CSV uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requestId:
 *                   type: string
 *                   example: "123e4567-e89b-12d3-a456-426614174000"
 *                 message:
 *                   type: string
 *                   example: "CSV uploaded successfully. Processing started."
 *                 file:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                       example: "upload_123.csv"
 *                     size:
 *                       type: number
 *                       example: 1234
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for CSV file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

// Error handling middleware
const handleUpload = (req, res, next) => {
    const uploadSingle = upload.single('csv');

    uploadSingle(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Multer error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

// Upload route
router.post('/', handleUpload, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No CSV file uploaded' });
        }

        const requestId = uuidv4();
        
        // Save to database
        await ProcessingRequest.create({
            requestId,
            filename: req.file.filename,
            status: 'pending'
        });

        // Start processing in background
        csvProcessor.processCSV(requestId, req.file.filename)
            .catch(error => console.error('Background processing error:', error));

        res.status(200).json({
            requestId,
            message: 'CSV uploaded successfully. Processing started.',
            file: {
                filename: req.file.filename,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error during upload' });
    }
});

module.exports = router; 