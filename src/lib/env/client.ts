// const envSchema = z.object({
// 	PUBLIC_AUTH_ORIGIN: z.string().min(1),
// 	PUBLIC_CALLBACK_URL: z.string().min(1),
// 	PUBLIC_LOGOUT_URL: z.string().min(1),
// 	PUBLIC_SITE_NAME: z.string().min(1)
// });
// type ClientEnv = z.infer<typeof envSchema>;

type ClientEnv = {
	PUBLIC_AUTH_ORIGIN: string;
	PUBLIC_CALLBACK_URL: string;
	PUBLIC_LOGOUT_URL: string;
	PUBLIC_SITE_NAME: string;
};
export const clientEnv = process.env as ClientEnv;
