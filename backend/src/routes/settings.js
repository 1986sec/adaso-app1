import { Router } from 'express';
import { readJson, writeJson } from '../storage.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const settings = readJson('settings') || {};
  res.json(settings);
});

router.put('/', authRequired, (req, res) => {
  const body = req.body || {};
  const current = readJson('settings') || {};
  const updated = { ...current, ...body };
  writeJson('settings', updated);
  res.json(updated);
});

export default router;


