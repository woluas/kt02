const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    port: Number(process.env.PORT) || 3000,
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024,
    uploadsRoot: path.join(__dirname, '../../uploads'),
    productsUploadDir: path.join(__dirname, '../../uploads/products'),
    allowedMimeTypes: ['image/jpeg', 'image/png'],
};