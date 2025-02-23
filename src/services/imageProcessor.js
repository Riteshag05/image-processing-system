const sharp = require('sharp');
const axios = require('axios');
const ProcessingRequest = require('../models/ProcessingRequest');
const path = require('path');
const fs = require('fs').promises;

class ImageProcessor {
  static async downloadImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  static async processImage(imageBuffer) {
    return sharp(imageBuffer)
      .resize({ width: 800 }) // Example resize
      .jpeg({ quality: 50 }) // 50% compression
      .toBuffer();
  }

  static async processProductImages(requestId) {
    try {
      const request = await ProcessingRequest.findOne({ requestId });
      if (!request) throw new Error('Request not found');

      request.status = 'processing';
      await request.save();

      for (const product of request.products) {
        const outputUrls = [];
        
        for (const inputUrl of product.inputImageUrls) {
          try {
            const imageBuffer = await this.downloadImage(inputUrl);
            const processedBuffer = await this.processImage(imageBuffer);
            
            // Here you would upload the processed image to your storage
            // and get back a URL. For now, we'll simulate it:
            const outputUrl = inputUrl.replace('.jpg', '-processed.jpg');
            outputUrls.push(outputUrl);
          } catch (error) {
            console.error(`Error processing image ${inputUrl}:`, error);
          }
        }
        
        product.outputImageUrls = outputUrls;
      }

      request.status = 'completed';
      await request.save();

      // Trigger webhook
      await this.triggerWebhook(requestId);
    } catch (error) {
      const request = await ProcessingRequest.findOne({ requestId });
      if (request) {
        request.status = 'failed';
        await request.save();
      }
      throw error;
    }
  }

  static async triggerWebhook(requestId) {
    try {
      const webhookUrl = process.env.WEBHOOK_URL;
      if (!webhookUrl) return;

      const request = await ProcessingRequest.findOne({ requestId });
      await axios.post(webhookUrl, {
        requestId,
        status: request.status,
        products: request.products
      });
    } catch (error) {
      console.error('Webhook trigger failed:', error);
    }
  }

  async processImages(imageUrls) {
    const processedUrls = [];

    for (const url of imageUrls) {
      try {
        // Download image
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);

        // Process image with Sharp
        const processed = await sharp(buffer)
          .resize(800, 800, { fit: 'inside' })
          .jpeg({ quality: 50 })
          .toBuffer();

        // Save processed image
        const filename = `processed_${Date.now()}_${path.basename(url)}`;
        const savePath = path.join('uploads', filename);
        await fs.writeFile(savePath, processed);

        processedUrls.push(`/uploads/${filename}`);
      } catch (error) {
        console.error(`Error processing image ${url}:`, error);
        processedUrls.push(null);
      }
    }

    return processedUrls;
  }
}

module.exports = new ImageProcessor(); 