import * as serverEnv from '$env/static/private';
import { mustValidateEnv } from '$lib/env';
import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string().min(1),
	TURSO_URL: z.string().min(1),
	TURSO_AUTH_TOKEN: z.string().optional(),
	ENV: z.enum(['DEV', 'PROD']),
	GOOGLE_CLIENT_ID: z.string().min(1),
	GOOGLE_CLIENT_SECRET: z.string().min(1),
	GOOGLE_AUTH_CALLBACK_URL: z.string().min(1),
	GITHUB_CLIENT_ID: z.string().min(1),
	GITHUB_CLIENT_SECRET: z.string().min(1),
	POST_CALLBACK_URL: z.string().min(1),
	POST_CALLBACK_ERROR_URL: z.string().min(1),
	POST_LOGOUT_URL: z.string().min(1),
	ORIGIN: z.string().min(1)
});

export const env = mustValidateEnv(envSchema, serverEnv);
