import { z } from 'zod';

export const ChallengeResponse = z.union([
	z.object({
		success: z.literal(true),
		id: z.string().min(1),
		challenge: z.string().min(1)
	}),
	z.object({
		success: z.literal(false),
		error: z.string().min(1)
	})
]);

export const RegistrationResponse = z.union([
	z.object({
		success: z.literal(true),
		id: z.string().min(1),
		name: z.string().min(1)
	}),
	z.object({
		success: z.literal(false),
		error: z.string().min(1)
	})
]);

export const AuthenticationResponse = z.union([
	z.object({
		success: z.literal(true),
		name: z.string().min(1)
	}),
	z.object({
		success: z.literal(false),
		error: z.string().min(1)
	})
]);
