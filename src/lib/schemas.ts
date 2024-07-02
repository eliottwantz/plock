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
