import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, 'data');
const files = {
  users: path.join(dataDir, 'users.json'),
  firmalar: path.join(dataDir, 'firmalar.json'),
  ziyaretler: path.join(dataDir, 'ziyaretler.json'),
  gelirGider: path.join(dataDir, 'gelirGider.json'),
  settings: path.join(dataDir, 'settings.json'),
  uploads: path.join(dataDir, 'uploads')
};

function ensureFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(files.users)) fs.writeFileSync(files.users, JSON.stringify([]));
  if (!fs.existsSync(files.firmalar)) fs.writeFileSync(files.firmalar, JSON.stringify([]));
  if (!fs.existsSync(files.ziyaretler)) fs.writeFileSync(files.ziyaretler, JSON.stringify([]));
  if (!fs.existsSync(files.gelirGider)) fs.writeFileSync(files.gelirGider, JSON.stringify([]));
  if (!fs.existsSync(files.settings)) fs.writeFileSync(files.settings, JSON.stringify({}));
  if (!fs.existsSync(files.uploads)) fs.mkdirSync(files.uploads, { recursive: true });
}

ensureFiles();

export function readJson(name) {
  const file = files[name];
  const content = fs.readFileSync(file, 'utf8') || '[]';
  try {
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}

export function writeJson(name, data) {
  const file = files[name];
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}


