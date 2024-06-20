import type { Database } from '$lib/db/schema';
import { serverEnv } from '$lib/env/server';
import { createClient } from '@libsql/client';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
import type { Dialect } from 'kysely';
import { Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import type { Adapter } from 'lucia';
import postgres from 'postgres';

let _db: Kysely<Database> | null = null;
export const createDBAndAdapter = () => {
	let dialect: Dialect;
	let adapter: Adapter;
	if (serverEnv.DB_TYPE === 'libsql') {
		dialect = new LibsqlDialect({
			url: serverEnv.DB_URL,
			authToken: serverEnv.DB_AUTH_TOKEN
		});
		adapter = new LibSQLAdapter(
			createClient({
				url: serverEnv.DB_URL,
				authToken: serverEnv.DB_AUTH_TOKEN
			}),
			{
				session: 'session',
				user: 'user'
			}
		);
	} else if (serverEnv.DB_TYPE === 'postgres') {
		const db = postgres(serverEnv.DB_URL);
		dialect = new PostgresJSDialect({
			postgres: db
		});
		adapter = new PostgresJsAdapter(db, {
			session: 'session',
			user: 'user'
		});
	} else {
		throw new Error('Invalid DB_TYPE');
	}

	_db = new Kysely<Database>({
		dialect
	});

	return { db: _db, adapter };
};

export const db = () => {
	if (!_db) {
		throw new Error('DB not initialized');
	}
	return _db;
};
