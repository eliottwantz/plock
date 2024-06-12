import * as clientEnv from '$env/static/public';
import { mustValidateEnv } from '$lib/env';
import { z } from 'zod';

const envSchema = z.object({
	PUBLIC_RP_NAME: z.string().min(1)
});

export const env = mustValidateEnv(envSchema, clientEnv);
