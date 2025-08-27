import { Router } from 'express';
import { readJson } from '../storage.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  if (!q) return res.json([]);
  const firmalar = readJson('firmalar');
  const ziyaretler = readJson('ziyaretler');
  const gelirGider = readJson('gelirGider');

  const results = [];
  firmalar.forEach(f => {
    if (
      f.firmaAdi?.toLowerCase().includes(q) ||
      f.sektor?.toLowerCase().includes(q) ||
      f.yetkiliKisi?.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'Firma',
        status: 'firma',
        name: f.firmaAdi,
        detail: f.sektor || '-',
        date: ''
      });
    }
  });

  ziyaretler.forEach(z => {
    if (
      z.firma?.toLowerCase().includes(q) ||
      z.ziyaretci?.toLowerCase().includes(q) ||
      z.amac?.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'Ziyaret',
        status: z.durum === 'Tamamlandı' ? 'görüşme-yapılan' : z.durum === 'Planlandı' ? 'planlandı' : 'ziyaret-edilmedi',
        name: z.firma,
        detail: z.amac || '-',
        date: z.tarih || ''
      });
    }
  });

  gelirGider.forEach(g => {
    if (g.aciklama?.toLowerCase().includes(q)) {
      results.push({
        type: g.tur,
        status: g.tur === 'Gelir' ? 'gelir' : 'gider',
        name: g.aciklama,
        detail: `${g.tutar} ₺`,
        date: g.tarih || ''
      });
    }
  });

  res.json(results.slice(0, 50));
});

router.get('/suggestions', authRequired, (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  if (!q) return res.json([]);
  const firmalar = readJson('firmalar');
  const ziyaretler = readJson('ziyaretler');
  const gelirGider = readJson('gelirGider');

  const set = new Set();
  firmalar.forEach(f => {
    [f.firmaAdi, f.sektor, f.yetkiliKisi].forEach(v => {
      if (v && v.toLowerCase().includes(q)) set.add(v);
    });
  });
  ziyaretler.forEach(z => {
    [z.firma, z.ziyaretci, z.amac].forEach(v => {
      if (v && v.toLowerCase().includes(q)) set.add(v);
    });
  });
  gelirGider.forEach(g => {
    [g.aciklama].forEach(v => {
      if (v && v.toLowerCase().includes(q)) set.add(v);
    });
  });

  res.json(Array.from(set).slice(0, 10));
});

export default router;


