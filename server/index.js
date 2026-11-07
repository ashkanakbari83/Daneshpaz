import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';

const config = loadConfig();
const db = openDatabase(config.databasePath);
const staticDir = existsSync('dist/index.html') ? 'dist' : null;
const server = createApp({ db, config, staticDir });

server.listen(config.port, () => {
  console.log(`Daneshpaz API: http://localhost:${config.port}  (db: ${config.databasePath}, env: ${config.nodeEnv})`);
  if (staticDir) console.log('Serving the built frontend from ./dist');
});

const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
