import { z } from 'zod';

// Environment schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z
    .string()
    .regex(/^\d+$/)
    .default('5000')
    .transform((val) => Number(val)),
  JWT_SECRET_KEY: z
    .string()
    .min(32, 'JWT_SECRET_KEY must be at least 32 characters')
    .default('cnasklcnsklcaskl'),
  JWT_EXPIRES_IN: z.string().default('90d'),
  JWT_COOKIE_EXPIRES_IN: z.string(),
  IMGUR_CLIENT_ID: z.string(),
  IMGUR_CLIENT_SECRET: z.string(),
  FRONTEND_URL: z.string(),
  DATABASE: z.string(),
  PASSWORD: z.string().default(' '),
  DATABASE_LOCAL: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z
    .string()
    .regex(/^\d+$/)

    .transform((val) => (val ? Number(val) : undefined)),
  EMAIL_USERNAME: z.string(),
  EMAIL_PASSWORD: z.string(),
  EMAIL_FROM: z.email('EMAIL_FROM must be a valid email').or(z.literal('')),
  EMAIL_FROM_NAME: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.issues.forEach((issue) => {
        const path = issue.path.join('.') || 'root';
        console.error(`  - ${path}: ${issue.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}
