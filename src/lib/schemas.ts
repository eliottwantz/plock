import { z } from 'zod';

export const ErrorResponseSchema = z.object({
	error: z.string().min(1)
});

export const ChallengeResponseSchema = z.object({
	id: z.string().min(1),
	challenge: z.string().min(1)
});

export const RegistrationResponseSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1)
});

export const AuthenticationResponseSchema = z.object({
	name: z.string().min(1)
});

export const EmailPasswordLoginSchema = z.object({
	email: z.string().email({ message: 'Must be a valid email' }),
	password: z.string().min(1, { message: 'Password is required' })
});

export const EmailPasswordRegistrationSchema = z.object({
	email: z.string().email({ message: 'Must be a valid email' }),
	name: z.string().min(1, { message: 'Name is required' }),
	password: z.string().min(1, { message: 'Password is required' }).max(128)
});

export const EmailPasswordResetSchema = z.object({
	email: z.string().email({ message: 'Must be a valid email' })
});

export const PasswordResetSchema = z
	.object({
		password: z.string().min(1, { message: 'Password is required' }).max(128),
		confirmPassword: z.string().min(1, { message: 'Password is required' }).max(128)
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const OtpSchema = z.object({
	'code-0': z.string().regex(/^\d{1}$/),
	'code-1': z.string().regex(/^\d{1}$/),
	'code-2': z.string().regex(/^\d{1}$/),
	'code-3': z.string().regex(/^\d{1}$/),
	'code-4': z.string().regex(/^\d{1}$/),
	'code-5': z.string().regex(/^\d{1}$/),
	'code-6': z.string().regex(/^\d{1}$/),
	'code-7': z.string().regex(/^\d{1}$/)
});
