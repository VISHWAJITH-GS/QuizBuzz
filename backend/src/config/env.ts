import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load .env if present
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().default('postgresql://quizbuzz:change-me@localhost:5432/quizbuzz'),
  SESSION_TTL_MINUTES: z.coerce.number().default(30),
  CLEANUP_INTERVAL_MINUTES: z.coerce.number().default(5),
  TEMP_UPLOAD_DIR: z.string().default('./.tmp/uploads'),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:3b'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  resolvedTempDir: path.resolve(process.cwd(), parsed.data.TEMP_UPLOAD_DIR)
};
