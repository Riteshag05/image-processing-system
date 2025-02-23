const mongoose = require('mongoose');

const processingRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0
  },
  completedAt: Date,
  error: String,
  filename: String,
  results: [{
    productName: String,
    originalUrls: [String],
    processedUrls: [String]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ProcessingRequest', processingRequestSchema); 