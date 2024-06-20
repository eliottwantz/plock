import { env } from '$env/dynamic/private';
import * as schema from '$lib/db/schema';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connection = postgres(env.DB_URL!);
export const db = drizzle(connection, {
	schema,
	logger: env.ENV === 'DEV'
});
