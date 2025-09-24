// scripts/write-env.mjs
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const app = process.argv[2] || 'projects/sso-sandbox';
const api = process.env.API_URL || 'http://localhost:3000'; // <- Netlify setea API_URL

const dir = resolve(app, 'public');
mkdirSync(dir, { recursive: true });

const file = resolve(dir, 'env.json');
writeFileSync(file, JSON.stringify({ API_URL: api }, null, 2));
console.log(`[write-env] ${file} -> API_URL=${api}`);
