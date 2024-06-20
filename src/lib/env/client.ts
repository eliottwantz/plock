import { env } from '$env/dynamic/public';
import { mustValidateEnv } from '$lib/env';
import { z } from 'zod';

const envSchema = z.object({
	PUBLIC_AUTH_ORIGIN: z.string().min(1),
	PUBLIC_CALLBACK_URL: z.string().min(1),
	PUBLIC_LOGOUT_URL: z.string().min(1),
	PUBLIC_SITE_NAME: z.string().min(1)
});

export const clientEnv = mustValidateEnv(envSchema, env);
