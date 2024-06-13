import * as clientEnv from '$env/static/public';
import { mustValidateEnv } from '$lib/env';
import { z } from 'zod';

const envSchema = z.object({
	PUBLIC_CALLBACK_URL: z.string().min(1),
	PUBLIC_LOGOUT_URL: z.string().min(1),
	PUBLIC_SITE_NAME: z.string().min(1)
});

// export const env = mustValidateEnv(envSchema, clientEnv);
