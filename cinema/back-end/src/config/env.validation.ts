import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1),
    FRONT_URL: z.string().url(),
    API_PUBLIC_URL: z.string().url(),
    LIQPAY_PUBLIC_KEY: z.string().min(1),
    LIQPAY_PRIVATE_KEY: z.string().min(1),
    LIQPAY_CURRENCY: z.string().length(3).default('UAH'),
    LIQPAY_SANDBOX: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.LIQPAY_SANDBOX) {
      ctx.addIssue({
        code: 'custom',
        path: ['LIQPAY_SANDBOX'],
        message: 'Sandbox mode must be disabled in production',
      });
    }
  });

export type Env = z.infer<typeof schema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = schema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
  }
  return parsed.data;
}