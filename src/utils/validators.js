const validateCSV = async (file) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (!file.originalname.endsWith('.csv')) {
    throw new Error('Invalid file type. Only CSV files are allowed');
  }

  // Validate CSV structure
  const rows = await csv().fromFile(file.path);
  
  // Check required columns
  const requiredColumns = ['S. No.', 'Product Name', 'Input Image Urls'];
  const headers = Object.keys(rows[0]);
  
  for (const column of requiredColumns) {
    if (!headers.includes(column)) {
      throw new Error(`Missing required column: ${column}`);
    }
  }

  // Validate each row
  rows.forEach((row, index) => {
    if (!row['S. No.'] || !row['Product Name'] || !row['Input Image Urls']) {
      throw new Error(`Missing data in row ${index + 1}`);
    }

    // Validate image URLs
    const urls = row['Input Image Urls'].split(',');
    urls.forEach(url => {
      if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png)$/i)) {
        throw new Error(`Invalid image URL in row ${index + 1}`);
      }
    });
  });
};

const validateImageUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = {
  validateCSV,
  validateImageUrl
}; 