import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { sessionService } from './session.service.js';

class CleanupService {
  private timer: NodeJS.Timeout | null = null;

  start(): void {
    if (this.timer) return;

    // Ensure temp dir exists
    if (!fs.existsSync(config.resolvedTempDir)) {
      try {
        fs.mkdirSync(config.resolvedTempDir, { recursive: true });
      } catch (err: any) {
        console.warn('[Cleanup] Failed to create temp upload dir:', err.message);
      }
    }

    const intervalMs = config.CLEANUP_INTERVAL_MINUTES * 60 * 1000;
    this.timer = setInterval(() => this.runCleanup(), intervalMs);
    console.log(`[Cleanup] Background cleaner scheduled every ${config.CLEANUP_INTERVAL_MINUTES} minute(s).`);
  }

  async runCleanup(): Promise<void> {
    try {
      const { count, durationMs } = await sessionService.cleanupExpiredSessions();

      // Clean temp upload files older than SESSION_TTL_MINUTES
      let filesRemoved = 0;
      if (fs.existsSync(config.resolvedTempDir)) {
        const files = fs.readdirSync(config.resolvedTempDir);
        const threshold = Date.now() - config.SESSION_TTL_MINUTES * 60 * 1000;

        for (const file of files) {
          const filePath = path.join(config.resolvedTempDir, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.mtimeMs < threshold) {
              fs.unlinkSync(filePath);
              filesRemoved++;
            }
          } catch {
            // File might have already been deleted
          }
        }
      }

      if (count > 0 || filesRemoved > 0) {
        console.log(`[Cleanup] Purged ${count} expired session(s) and ${filesRemoved} temp file(s) in ${durationMs}ms.`);
      }
    } catch (err: any) {
      console.error('[Cleanup] Error during scheduled cleanup cycle:', err.message);
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const cleanupService = new CleanupService();
