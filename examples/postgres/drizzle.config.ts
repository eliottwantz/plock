import { defineConfig } from 'drizzle-kit';

if (!process.env.DB_URL) {
	throw new Error('Missing DB_URL environment variable');
}

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DB_URL
	},
	verbose: true,
	strict: true
});
