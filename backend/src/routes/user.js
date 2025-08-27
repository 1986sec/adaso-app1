import { Router } from 'express';
import { readJson } from '../storage.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.get('/profile', authRequired, (req, res) => {
  const users = readJson('users');
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
  res.json({ id: user.id, adsoyad: user.adsoyad, email: user.email, kullaniciAdi: user.kullaniciAdi });
});

router.put('/profile', authRequired, (req, res) => {
  const users = readJson('users');
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

  const { adsoyad, email, kullaniciAdi, telefon } = req.body || {};

  // Benzersizlik kontrolleri
  if (email && users.some(u => u.email === email && u.id !== req.user.id)) {
    return res.status(409).json({ message: 'Bu e-posta kullanımda' });
  }
  if (kullaniciAdi && users.some(u => u.kullaniciAdi === kullaniciAdi && u.id !== req.user.id)) {
    return res.status(409).json({ message: 'Bu kullanıcı adı kullanımda' });
  }

  users[idx] = {
    ...users[idx],
    ...(adsoyad !== undefined ? { adsoyad } : {}),
    ...(email !== undefined ? { email } : {}),
    ...(kullaniciAdi !== undefined ? { kullaniciAdi } : {}),
    ...(telefon !== undefined ? { telefon } : {})
  };

  writeJson('users', users);
  const u = users[idx];
  res.json({ id: u.id, adsoyad: u.adsoyad, email: u.email, kullaniciAdi: u.kullaniciAdi, telefon: u.telefon });
});

export default router;


