import { env } from '$env/dynamic/private';
import * as schema from '$lib/db/schema';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const connection = createClient({
	url: env.TURSO_URL!,
	authToken: env.TURSO_AUTH_TOKEN
});
export const db = drizzle(connection, {
	schema,
	logger: env.ENV === 'DEV'
});
