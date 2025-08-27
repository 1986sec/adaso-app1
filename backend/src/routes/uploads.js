import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRequired } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'data', 'uploads');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}_${sanitized}`);
  }
});

const upload = multer({ storage });

const router = Router();

router.post('/', authRequired, upload.array('files'), (req, res) => {
  const files = (req.files || []).map(f => ({
    filename: f.filename,
    path: `/uploads/${f.filename}`,
    size: f.size,
    mimetype: f.mimetype
  }));
  res.json({ ok: true, files });
});

export default router;


