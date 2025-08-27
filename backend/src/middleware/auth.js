import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const header = req.headers['authorization'] || req.headers['x-auth-token'];
  if (!header) return res.status(401).json({ message: 'Yetkisiz' });
  const token = header.startsWith('Bearer ') ? header.substring(7) : header;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
}


