const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, config.productsUploadDir),
    filename: (req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (config.allowedMimeTypes.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Разрешены только изображения JPEG и PNG');
    err.status = 400;
    cb(err);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: config.maxFileSize, files: 1 },
});

module.exports = upload;