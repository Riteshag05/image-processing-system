const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const ProcessingRequest = require('../models/ProcessingRequest');
const imageProcessor = require('./imageProcessor');

class CSVProcessor {
  static validateCSVFormat(data) {
    const requiredColumns = ['S. No.', 'Product Name', 'Input Image Urls'];
    const headers = Object.keys(data[0]);
    
    return requiredColumns.every(col => headers.includes(col));
  }

  static async parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const readable = Readable.from(buffer.toString());
      
      readable
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  async processCSV(requestId, filename) {
    try {
      const filePath = path.join('uploads', filename);
      const request = await ProcessingRequest.findOne({ requestId });
      
      if (!request) {
        throw new Error('Request not found');
      }

      // Update status to processing
      request.status = 'processing';
      await request.save();

      const results = [];
      let totalRows = 0;
      let processedRows = 0;

      // First count total rows
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', () => totalRows++)
          .on('end', resolve)
          .on('error', reject);
      });

      // Process the CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', async (row) => {
            try {
              const imageUrls = row['Input Image Urls'].split(',');
              const processedImages = await imageProcessor.processImages(imageUrls);
              
              results.push({
                productName: row['Product Name'],
                originalUrls: imageUrls,
                processedUrls: processedImages
              });

              processedRows++;
              
              // Update progress less frequently
              if (processedRows % 5 === 0 || processedRows === totalRows) {
                const progress = Math.round((processedRows / totalRows) * 100);
                request.progress = progress;
                await request.save();
              }
            } catch (error) {
              console.error('Error processing row:', error);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Final update
      request.status = 'completed';
      request.completedAt = new Date();
      request.results = results;
      await request.save();

    } catch (error) {
      console.error('CSV Processing error:', error);
      
      // Update request as failed
      const request = await ProcessingRequest.findOne({ requestId });
      if (request) {
        request.status = 'failed';
        request.error = error.message;
        await request.save();
      }
      
      throw error;
    }
  }
}

module.exports = new CSVProcessor(); 