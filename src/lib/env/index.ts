import { Schema } from 'zod';

export const mustValidateEnv = <T>(schema: Schema<T>, env: unknown): T => {
	const parseResult = schema.safeParse(env);

	if (!parseResult.success) {
		console.error('Invalid environment variables');
		for (const error of parseResult.error.issues) {
			console.log(error.path, error.message);
		}
		throw new Error(
			'Invalid environment variables: ' + JSON.stringify(parseResult.error.flatten())
		);
	}

	return parseResult.data;
};
