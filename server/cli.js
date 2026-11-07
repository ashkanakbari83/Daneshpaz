import { randomBytes } from 'node:crypto';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';
import { createUser } from './auth.js';
import { seedDemo, resetContent } from './seed.js';
import { ROLES } from './domain.js';

const [command, ...args] = process.argv.slice(2);
const config = loadConfig();
const db = openDatabase(config.databasePath);

async function main() {
  if (command === 'seed') {
    if (args.includes('--force')) {
      resetContent(db);
      console.log('Existing content removed (users kept).');
    }
    console.log(seedDemo(db) ? 'Demo content loaded (all prices are SAMPLES).' : 'Database already has content; use --force to replace it.');
    return;
  }

  if (command === 'create-admin') {
    const email = args.find((a) => !a.startsWith('--'));
    const roleArg = args.find((a) => a.startsWith('--role='))?.slice(7) ?? 'admin';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ROLES.includes(roleArg)) {
      console.error('Usage: npm run admin:create -- <email> [--role=admin|editor]   (password from ADMIN_PASSWORD, else generated)');
      process.exitCode = 1;
      return;
    }
    let password = process.env.ADMIN_PASSWORD;
    let generated = false;
    if (!password) {
      password = randomBytes(12).toString('base64url');
      generated = true;
    }
    if (password.length < 10) {
      console.error('Password must be at least 10 characters.');
      process.exitCode = 1;
      return;
    }
    await createUser(db, { email, password, role: roleArg });
    console.log(`Created ${roleArg}: ${email}`);
    if (generated) console.log(`Generated password (shown once, change it later): ${password}`);
    return;
  }

  console.error('Commands: seed [--force] | create-admin <email> [--role=admin|editor]');
  process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error.code === 'ERR_SQLITE_ERROR' && /UNIQUE/.test(error.message) ? 'That email already exists.' : error);
    process.exitCode = 1;
  })
  .finally(() => db.close());
