import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './src/routes/auth.js';
import firmalarRoutes from './src/routes/firmalar.js';
import ziyaretlerRoutes from './src/routes/ziyaretler.js';
import gelirGiderRoutes from './src/routes/gelirGider.js';
import userRoutes from './src/routes/user.js';
import searchRoutes from './src/routes/search.js';
import { seedIfEmpty } from './src/seed.js';
import settingsRoutes from './src/routes/settings.js';
import uploadsRoutes from './src/routes/uploads.js';
import { initDb } from './src/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'adaso-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/firmalar', firmalarRoutes);
app.use('/api/ziyaretler', ziyaretlerRoutes);
app.use('/api/gelir-gider', gelirGiderRoutes);
app.use('/api/user', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadsRoutes);

// Static serve for data (optional for debug)
app.use('/data', express.static(path.join(__dirname, 'src', 'data')));
app.use('/uploads', express.static(path.join(__dirname, 'src', 'data', 'uploads')));

const port = process.env.PORT || 8080;
initDb().then(() => seedIfEmpty()).then(() => {
  app.listen(port, () => {
    console.log(`ADASO backend listening on port ${port}`);
  });
});


