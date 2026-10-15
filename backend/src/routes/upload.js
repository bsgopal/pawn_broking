import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure upload directory exists
const uploadDir = process.env.VERCEL ? path.join(os.tmpdir(), 'uploads') : path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Upload Router] Upload directory init skipped or read-only:', e.message);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Single image / document upload
router.post('/single', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Multiple image upload (e.g. 1+ ornament photos)
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const uploadedFiles = req.files.map(f => ({
      fileUrl: `/uploads/${f.filename}`,
      filename: f.filename,
      originalName: f.originalname,
      size: f.size
    }));
    res.json({
      success: true,
      files: uploadedFiles,
      urls: uploadedFiles.map(f => f.fileUrl)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Direct Base64 Data-URI upload (for webcam snapshots and digital signature pad)
router.post('/base64', (req, res) => {
  try {
    const { base64Data, prefix = 'snap' } = req.body;
    if (!base64Data) {
      return res.status(400).json({ success: false, message: 'No base64 data provided' });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If raw base64 or already a URL
      if (base64Data.startsWith('http') || base64Data.startsWith('/uploads/')) {
        return res.json({ success: true, fileUrl: base64Data });
      }
      return res.status(400).json({ success: false, message: 'Invalid base64 string' });
    }

    const mimeType = matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    let ext = '.png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
    else if (mimeType.includes('pdf')) ext = '.pdf';

    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E6)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, dataBuffer);
    const fileUrl = `/uploads/${filename}`;

    res.json({
      success: true,
      fileUrl,
      filename
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
