/**
 * @file upload.js
 * @description Middleware for handling file uploads using Multer.
 * Configures storage, file size limits, and valid mime types for bill documents.
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const billsUploadDir = path.join(__dirname, '..', '..', 'uploads', 'bills');

if (!fs.existsSync(billsUploadDir)) {
    fs.mkdirSync(billsUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, billsUploadDir);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname);
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${extension}`);
    },
});

const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp',
]);

const billDocumentUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error('Unsupported file type. Allowed: pdf, doc, docx, xls, xlsx, txt, csv, jpg, png, webp'));
    },
});

const handleBillUpload = (req, res, next) => {
    billDocumentUpload.single('document')(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Document size exceeds 10MB limit' });
        }

        return res.status(400).json({ message: error.message });
    });
};

module.exports = {
    handleBillUpload,
};