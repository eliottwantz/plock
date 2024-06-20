import { clientEnv } from '$lib/env/client';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { server } from '@passwordless-id/webauthn';
import { json } from '@sveltejs/kit';
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
	const challenge = await db()
		.selectFrom('challenge')
		.where('id', '=', challengeId)
		.selectAll()
		.executeTakeFirst();

	if (!challenge) {
		return json({ error: 'invalid_challenge' }, { status: 400 });
	}

	// Remove the challenge from the database because it is used
	await db()
		.deleteFrom('challenge')
		.where('id', '=', challenge.id)
		.execute()
		.catch((e) => {
			console.log('Error deleting challenge: ', e);
		});

	const credential = await db()
		.selectFrom('credential')
		.where('id', '=', authentication.credentialId)
		.selectAll()
		.executeTakeFirst();

	if (!credential) {
		return json({ error: 'invalid_credential' }, { status: 400 });
	}

	const expected = {
		challenge: challenge.challenge,
		origin: clientEnv.PUBLIC_AUTH_ORIGIN ?? url.origin,
		userVerified: true,
		counter: -1
	};

	const authenticationParsed = await server
		.verifyAuthentication(
			authentication,
			{
				id: credential.id,
				publicKey: credential.public_key,
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

	const user = await db()
		.selectFrom('user')
		.where('id', '=', credential.user_id)
		.selectAll()
		.executeTakeFirst();

	if (!user) {
		return json({ error: 'unknown_user' }, { status: 400 });
	}

	const session = await lucia.createSession(credential.user_id, {
		created_at: new Date(),
		ip: getClientAddress(),
		user_agent: request.headers.get('user-agent')
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
