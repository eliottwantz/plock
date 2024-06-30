import { env } from '$env/dynamic/private';
import type { Database } from '$lib/db/schema';
import { serverEnv } from '$lib/env/server';
import { createClient } from '@libsql/client';
import { LibsqlDialect } from '@libsql/kysely-libsql';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
import type { DatabaseIntrospector, Dialect, DialectAdapter, Driver, QueryCompiler } from 'kysely';
import { DummyDriver, Kysely } from 'kysely';
import { PostgresJSDialect } from 'kysely-postgres-js';
import type { Adapter } from 'lucia';
import postgres from 'postgres';

class MemoryDialect implements Dialect {
	createAdapter(): DialectAdapter {
		return {} as DialectAdapter;
	}
	createDriver(): Driver {
		return new DummyDriver();
	}
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
	createIntrospector(db: Kysely<any>): DatabaseIntrospector {
		return {} as DatabaseIntrospector;
	}
	createQueryCompiler(): QueryCompiler {
		return {} as QueryCompiler;
	}
}

let dialect: Dialect;
export let adapter: Adapter;

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
	dialect = new MemoryDialect();
}

console.log('dialect', dialect);
console.log('\n\nENV\n', env);
console.log('\n\nPROCESS.ENV\n', process.env);

export const db = new Kysely<Database>({
	dialect
});
