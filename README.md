# Image Processing System

A system to efficiently process image data from CSV files.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create .env file:
```
MONGODB_URI=your_mongodb_uri
PORT=3000
```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Upload CSV
- **POST** `/api/upload`
- Body: form-data with key 'csv'
- Returns: requestId for status checking

### Check Status
- **GET** `/api/status/:requestId`
- Returns: Processing status and progress

## CSV Format
```csv
S. No.,Product Name,Input Image Urls
1,SKU1,"url1,url2"
2,SKU2,"url3,url4"
```

## API Documentation
See [API Documentation](docs/API.md) for details.

## Testing
Use the provided Postman collection in `postman/` directory. 