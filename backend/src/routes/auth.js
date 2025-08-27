import { Router } from 'express';
import { readJson, writeJson } from '../storage.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/register', async (req, res) => {
  const { adsoyad, email, kullaniciAdi, sifre } = req.body || {};
  if (!adsoyad || !email || !kullaniciAdi || !sifre) {
    return res.status(400).json({ message: 'Eksik alanlar' });
  }
  const users = readJson('users');
  const exists = users.find(u => u.kullaniciAdi === kullaniciAdi || u.email === email);
  if (exists) return res.status(409).json({ message: 'Kullanıcı zaten var' });

  const hash = await bcrypt.hash(sifre, 10);
  const user = { id: users.length ? Math.max(...users.map(u => u.id || 0)) + 1 : 1, adsoyad, email, kullaniciAdi, sifre: hash };
  users.push(user);
  writeJson('users', users);
  return res.json({ ok: true });
});

router.post('/login', async (req, res) => {
  const { kullaniciAdi, sifre } = req.body || {};
  if (!kullaniciAdi || !sifre) return res.status(400).json({ message: 'Eksik alanlar' });
  const users = readJson('users');
  const user = users.find(u => u.kullaniciAdi === kullaniciAdi || u.email === kullaniciAdi);
  if (!user) return res.status(401).json({ message: 'Geçersiz kullanıcı veya şifre' });
  const ok = await bcrypt.compare(sifre, user.sifre);
  if (!ok) return res.status(401).json({ message: 'Geçersiz kullanıcı veya şifre' });
  const token = jwt.sign({ id: user.id, kullaniciAdi: user.kullaniciAdi, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
  return res.json({ token, user: { id: user.id, kullaniciAdi: user.kullaniciAdi, adsoyad: user.adsoyad, email: user.email } });
});

// Şifre sıfırlama başlatma (email/sms yok, token döner)
router.post('/forgot', async (req, res) => {
  const { identifier } = req.body || {};
  if (!identifier) return res.status(400).json({ message: 'Kullanıcı adı veya e-posta gerekli' });
  const users = readJson('users');
  const idx = users.findIndex(u => u.kullaniciAdi === identifier || u.email === identifier);
  if (idx === -1) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

  const resetToken = jwt.sign({ id: users[idx].id, purpose: 'password_reset' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '15m' });
  users[idx].resetToken = resetToken;
  users[idx].resetTokenCreatedAt = Date.now();
  writeJson('users', users);

  // Gerçek sistemde token mail ile gönderilir. Biz direkt döndürüyoruz.
  return res.json({ ok: true, resetToken });
});

// Şifre sıfırlama tamamlama
router.post('/reset', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ message: 'Token ve yeni şifre gerekli' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (payload.purpose !== 'password_reset') throw new Error('Invalid purpose');
    const users = readJson('users');
    const idx = users.findIndex(u => u.id === payload.id && u.resetToken === token);
    if (idx === -1) return res.status(400).json({ message: 'Geçersiz veya kullanılmış token' });
    const hash = await bcrypt.hash(newPassword, 10);
    users[idx].sifre = hash;
    delete users[idx].resetToken;
    delete users[idx].resetTokenCreatedAt;
    writeJson('users', users);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ message: 'Token geçersiz veya süresi doldu' });
  }
});

// Şifre değiştirme (oturum açıkken)
router.post('/change-password', async (req, res) => {
  const header = req.headers['authorization'] || req.headers['x-auth-token'];
  if (!header) return res.status(401).json({ message: 'Yetkisiz' });
  const token = header.startsWith('Bearer ') ? header.substring(7) : header;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Eksik alanlar' });
    const users = readJson('users');
    const idx = users.findIndex(u => u.id === decoded.id);
    if (idx === -1) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    const ok = await bcrypt.compare(oldPassword, users[idx].sifre);
    if (!ok) return res.status(400).json({ message: 'Eski şifre hatalı' });
    const hash = await bcrypt.hash(newPassword, 10);
    users[idx].sifre = hash;
    writeJson('users', users);
    return res.json({ ok: true });
  } catch (e) {
    return res.status(401).json({ message: 'Yetkisiz' });
  }
});

export default router;


