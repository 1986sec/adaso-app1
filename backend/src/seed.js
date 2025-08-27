import bcrypt from 'bcryptjs';
import { readJson, writeJson } from './storage.js';

export async function seedIfEmpty() {
  // Users
  const users = readJson('users');
  if (users.length === 0) {
    const hash = await bcrypt.hash('123456', 10);
    writeJson('users', [
      { id: 1, adsoyad: 'Admin Kullanıcı', email: 'admin@example.com', kullaniciAdi: 'admin', sifre: hash, telefon: '05000000000' }
    ]);
  }

  // Firmalar
  const firmalar = readJson('firmalar');
  if (firmalar.length === 0) {
    writeJson('firmalar', [
      { id: 1, firmaAdi: 'AdaSoft', sektor: 'Yazılım', telefon: '0322 000 00 00', email: 'info@adasoft.com', yetkiliKisi: 'Ahmet Yılmaz', yetkiliNumara: '0505 000 00 00', adres: 'Adana' },
      { id: 2, firmaAdi: 'Çukurova Tekstil', sektor: 'Tekstil', telefon: '0322 111 11 11', email: 'iletisim@cukurovatekstil.com', yetkiliKisi: 'Mehmet Kaya', yetkiliNumara: '0506 111 11 11', adres: 'Adana' }
    ]);
  }

  // Ziyaretler
  const ziyaretler = readJson('ziyaretler');
  if (ziyaretler.length === 0) {
    writeJson('ziyaretler', [
      { id: 1, tarih: '2025-01-15', saat: '10:00', firma: 'AdaSoft', ziyaretci: 'Admin Kullanıcı', amac: 'Tanışma', durum: 'Tamamlandı', notlar: 'Olumlu geçti', detayliBilgi: 'Ürün demo yapıldı', katilimcilar: '3', lokasyon: 'Adana', dosyalar: [], gelirTutari: 5000, giderTutari: 0, finansalAciklama: 'Demo sonrası teklif' },
      { id: 2, tarih: '2025-02-02', saat: '14:00', firma: 'Çukurova Tekstil', ziyaretci: 'Admin Kullanıcı', amac: 'Teklif', durum: 'Planlandı', notlar: '', detayliBilgi: '', katilimcilar: '2', lokasyon: 'Adana', dosyalar: [], gelirTutari: 0, giderTutari: 200, finansalAciklama: 'Yol' }
    ]);
  }

  // Gelir Gider
  const gelirGider = readJson('gelirGider');
  if (gelirGider.length === 0) {
    writeJson('gelirGider', [
      { id: 1, tarih: '2025-01-01', aciklama: 'Lisans satışı', kategori: 'Satış', tur: 'Gelir', tutar: 25000 },
      { id: 2, tarih: '2025-01-10', aciklama: 'Ofis gideri', kategori: 'Genel Gider', tur: 'Gider', tutar: 3500 }
    ]);
  }
}


