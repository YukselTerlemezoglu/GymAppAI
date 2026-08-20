// public/icon.svg -> PWA PNG ikonlari (192/512) + favicon.
// Bagimlilik: sharp (devDependency olarak kurulur; tekrar kullanilabilir).
// Kullanim: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public', 'icon.svg');

await sharp(src, { density: 300 }).resize(192, 192).png().toFile(join(root, 'public', 'pwa-192x192.png'));
console.log('OK  public/pwa-192x192.png');

await sharp(src, { density: 300 }).resize(512, 512).png().toFile(join(root, 'public', 'pwa-512x512.png'));
console.log('OK  public/pwa-512x512.png');

await sharp(src, { density: 300 }).resize(180, 180).png().toFile(join(root, 'public', 'apple-touch-icon.png'));
console.log('OK  public/apple-touch-icon.png');

await sharp(src, { density: 300 }).resize(64, 64).png().toFile(join(root, 'public', 'favicon-64.png'));
console.log('OK  public/favicon-64.png');
