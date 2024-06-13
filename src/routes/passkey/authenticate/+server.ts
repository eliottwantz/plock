import { env } from '$env/dynamic/public';
import { challengeTable } from '$lib/db/schema';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { server } from '@passwordless-id/webauthn';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const POST = async ({ request, url, cookies, getClientAddress }) => {
	const Body = z.object({
		challengeId: z.string(),
		authentication: z.object({
			credentialId: z.string(),
			authenticatorData: z.string(),
			clientData: z.string(),
			signature: z.string()
		})
	});

	const body = await request.json();
	const parsed = Body.safeParse(body);
	if (!parsed.success) {
		return json({ error: 'invalid_body' }, { status: 400 });
	}

	const { challengeId, authentication } = parsed.data;
	// TODO: check for 5min max age
	const challenge = await db.query.challengeTable.findFirst({
		where: (table, { and, eq }) => and(eq(table.id, challengeId))
	});

	if (!challenge) {
		return json({ error: 'invalid_challenge' }, { status: 400 });
	}

	// Remove the challenge from the database because it is used
	await db
		.delete(challengeTable)
		.where(eq(challengeTable.id, challenge.id))
		.execute()
		.catch((e) => {
			console.log('Error deleting challenge: ', e);
		});

	const credential = await db.query.credentialTable.findFirst({
		where: (table, { and, eq }) => and(eq(table.id, authentication.credentialId))
	});

	if (!credential) {
		return json({ error: 'invalid_credential' }, { status: 400 });
	}

	const expected = {
		challenge: challenge.challenge,
		origin: env.PUBLIC_AUTH_ORIGIN ?? url.origin,
		userVerified: true,
		counter: -1
	};

	const authenticationParsed = await server
		.verifyAuthentication(
			authentication,
			{
				id: credential.id,
				publicKey: credential.publicKey,
				algorithm: credential.algorithm
			},
			expected
		)
		.catch((e) => {
			console.log('Error verifying authentication: ', e);
			return null;
		});

	if (!authenticationParsed) {
		return json({ error: 'authentication_failed' }, { status: 400 });
	}

	const user = await db.query.userTable.findFirst({
		where: (table, { and, eq }) => and(eq(table.id, credential.userId))
	});

	if (!user) {
		return json({ error: 'unknown_user' }, { status: 400 });
	}

	const session = await lucia.createSession(credential.userId, {
		createdAt: new Date(),
		ip: getClientAddress(),
		userAgent: request.headers.get('user-agent')
	});
	const sessionCookie = lucia.createSessionCookie(session.id);

	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});

	return json({
		name: credential.name
	});
};
