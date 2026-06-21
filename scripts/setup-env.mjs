// Cross-platform first-run helper: create a local .env from .env.example if missing,
// so `npm run dev` works on a fresh clone with zero manual setup.
import { existsSync, copyFileSync } from 'node:fs';

if (existsSync('.env')) {
  console.log('• .env already exists — leaving it untouched');
} else if (existsSync('.env.example')) {
  copyFileSync('.env.example', '.env');
  console.log('• Created .env from .env.example (SQLite dev defaults)');
} else {
  console.warn('• No .env or .env.example found — set DATABASE_URL yourself');
}
