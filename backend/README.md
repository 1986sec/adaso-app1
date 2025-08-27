# ADASO Backend (Node/Express)

Bu backend, mevcut frontend'in beklediği API uç noktalarını sağlar.

## Çalıştırma

1) Dizine gidin ve bağımlılıkları yükleyin:

```
cd backend
npm install
```

2) Ortam değişkenleri: `.env` dosyası oluşturun:

```
PORT=8080
JWT_SECRET=supersecret-change-me
FRONTEND_ORIGIN=http://localhost:5500
```

3) Başlatın:

```
npm run dev
# veya
npm start
```

Sunucu: `http://localhost:8080`

## Uç Noktalar
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/profile` (Auth gerekli)
- `GET/POST/PUT/DELETE /api/firmalar` (Auth gerekli)
- `GET/POST/PUT/DELETE /api/ziyaretler` (Auth gerekli)
- `GET/POST/PUT/DELETE /api/gelir-gider` (Auth gerekli)
- `GET /api/search?q=` (Auth gerekli)
- `GET /api/search/suggestions?q=` (Auth gerekli)

Authorization: `Authorization: Bearer <token>` veya `x-auth-token: <token>`

## Notlar
- Veri saklama JSON dosyaları `backend/src/data/` altındadır.
- İlk çalıştırmada dosyalar otomatik oluşturulur.
- Frontend geliştirme için `API_BASE_URL` değerini `http://localhost:8080/api` olarak ayarlayın.

