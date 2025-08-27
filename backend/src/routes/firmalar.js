import { Router } from 'express';
import { readJson, writeJson } from '../storage.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const list = readJson('firmalar');
  res.json(list);
});

router.post('/', authRequired, (req, res) => {
  const list = readJson('firmalar');
  const nextId = list.length ? Math.max(...list.map(x => x.id || 0)) + 1 : 1;
  const firma = { id: nextId, ...req.body };
  list.push(firma);
  writeJson('firmalar', list);
  res.json(firma);
});

router.put('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const list = readJson('firmalar');
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Bulunamadı' });
  list[idx] = { ...list[idx], ...req.body, id };
  writeJson('firmalar', list);
  res.json(list[idx]);
});

router.delete('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  const list = readJson('firmalar');
  const filtered = list.filter(x => x.id !== id);
  writeJson('firmalar', filtered);
  res.json({ ok: true });
});

export default router;


