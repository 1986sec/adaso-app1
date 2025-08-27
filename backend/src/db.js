import { Pool } from 'pg';

let pool = null;

export function hasDb() {
  return !!process.env.DATABASE_URL;
}

export function getPool() {
  if (!hasDb()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined
    });
  }
  return pool;
}

export async function initDb() {
  if (!hasDb()) return;
  const p = getPool();
  await p.query(`
    create table if not exists users (
      id serial primary key,
      adsoyad text,
      email text unique,
      kullanici_adi text unique,
      sifre text,
      telefon text,
      reset_token text,
      reset_token_created_at bigint
    );
    create table if not exists firmalar (
      id serial primary key,
      firma_adi text,
      sektor text,
      telefon text,
      email text,
      yetkili_kisi text,
      yetkili_numara text,
      adres text
    );
    create table if not exists ziyaretler (
      id serial primary key,
      tarih text,
      saat text,
      firma text,
      ziyaretci text,
      amac text,
      durum text,
      notlar text,
      detayli_bilgi text,
      katilimcilar text,
      lokasyon text,
      dosyalar jsonb,
      gelir_tutari numeric,
      gider_tutari numeric,
      finansal_aciklama text
    );
    create table if not exists gelir_gider (
      id serial primary key,
      tarih text,
      aciklama text,
      kategori text,
      tur text,
      tutar numeric
    );
    create table if not exists settings (
      id int primary key default 1,
      data jsonb
    );
    insert into settings (id, data) values (1, '{}') on conflict (id) do nothing;
  `);
}


