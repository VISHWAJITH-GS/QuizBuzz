import { app } from './app.js';
import { config } from './config/env.js';
import { db } from './db/pool.js';
import { cleanupService } from './services/cleanup.service.js';

async function bootstrap() {
  await db.initDatabase();
  cleanupService.start();

  const server = app.listen(config.PORT, () => {
    console.log(`[Server] QuizBuzz AI Backend running on http://localhost:${config.PORT}`);
    console.log(`[Server] Session TTL: ${config.SESSION_TTL_MINUTES}m | Cleanup: every ${config.CLEANUP_INTERVAL_MINUTES}m`);
    console.log(`[Server] Target Ollama: ${config.OLLAMA_BASE_URL} (${config.OLLAMA_MODEL})`);
  });

  const shutdown = async () => {
    console.log('[Server] Shutting down gracefully...');
    cleanupService.stop();
    server.close(async () => {
      await db.close();
      console.log('[Server] Cleaned up connections. Exiting.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});
