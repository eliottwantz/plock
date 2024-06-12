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
