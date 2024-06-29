// const envSchema = z
// 	.object({
// 		ENV: z.enum(['DEV', 'PROD']),
// 		GOOGLE_CLIENT_ID: z.string().min(1),
// 		GOOGLE_CLIENT_SECRET: z.string().min(1),
// 		GOOGLE_AUTH_CALLBACK_URL: z.string().min(1),
// 		GITHUB_CLIENT_ID: z.string().min(1),
// 		GITHUB_CLIENT_SECRET: z.string().min(1)
// 	})
// 	.and(
// 		z.discriminatedUnion('DB_TYPE', [
// 			z.object({
// 				DB_TYPE: z.literal('libsql'),
// 				DB_URL: z.string().default('http://host.docker.internal:8080'),
// 				DB_AUTH_TOKEN: z.string().optional()
// 			}),
// 			z.object({
// 				DB_TYPE: z.literal('postgres'),
// 				DB_URL: z
// 					.string()
// 					.default('postgresql://postgres:postgres@host.docker.internal:5432/postgres')
// 			})
// 		])
// 	);
// type ServerEnv = z.infer<typeof envSchema>;

export type ServerEnv = {
	ENV: 'DEV' | 'PROD';
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GOOGLE_AUTH_CALLBACK_URL: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
} & (
	| {
			DB_TYPE: 'libsql';
			DB_URL: string;
			DB_AUTH_TOKEN?: string | undefined;
	  }
	| {
			DB_TYPE: 'postgres';
			DB_URL: string;
	  }
);

export const serverEnv = process.env as ServerEnv;
