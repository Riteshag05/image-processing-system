# Image Processing System API Documentation

## Upload CSV
**Endpoint:** POST /api/upload  
**Content-Type:** multipart/form-data  
**Body:** 
- csv: CSV file

**Response:**
```json
{
  "requestId": "uuid-string",
  "message": "CSV uploaded successfully. Processing started."
}
``` 

## Check Status
**Endpoint:** GET /api/status/:requestId

**Parameters:**
- requestId: The unique identifier returned from the upload endpoint

**Response:**
```json
{
  "requestId": "uuid-string",
  "status": "pending|processing|completed|failed",
  "products": [
    {
      "serialNumber": "1",
      "productName": "SKU1",
      "inputImageUrls": [
        "https://www.public-image-url1.jpg",
        "https://www.public-image-url2.jpg"
      ],
      "outputImageUrls": [
        "https://www.public-image-output-url1.jpg",
        "https://www.public-image-output-url2.jpg"
      ]
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid CSV format"
}
```

### 404 Not Found
```json
{
  "error": "Request not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error message"
}
```

## CSV File Format
The CSV file should contain the following columns:
1. S. No. - Serial Number
2. Product Name - Name of the product
3. Input Image Urls - Comma-separated list of image URLs

Example CSV format:
```csv
S. No.,Product Name,Input Image Urls
1,SKU1,"https://www.public-image-url1.jpg,https://www.public-image-url2.jpg"
2,SKU2,"https://www.public-image-url1.jpg,https://www.public-image-url2.jpg"
```

## Processing Details
- Images are compressed to 50% of original quality
- Processing is done asynchronously
- Webhook notification is sent upon completion