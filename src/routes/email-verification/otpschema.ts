import { z } from 'zod';

export const otpSchema = z.object({
	// code: z.string().regex(/^\d{8}$/, {
	// 	message: 'The input must be an 8-digit number.'
	// })
	'code-0': z.string().regex(/^\d{1}$/),
	'code-1': z.string().regex(/^\d{1}$/),
	'code-2': z.string().regex(/^\d{1}$/),
	'code-3': z.string().regex(/^\d{1}$/),
	'code-4': z.string().regex(/^\d{1}$/),
	'code-5': z.string().regex(/^\d{1}$/),
	'code-6': z.string().regex(/^\d{1}$/),
	'code-7': z.string().regex(/^\d{1}$/)
});
