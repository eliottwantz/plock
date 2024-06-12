import { challengeTable } from '$lib/db/schema';
import { env } from '$lib/env/server';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { server } from '@passwordless-id/webauthn';
import { Type } from '@sinclair/typebox';
import { Check } from '@sinclair/typebox/value';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const POST = async ({ request, url, cookies, getClientAddress }) => {
	const Body = Type.Object({
		challengeId: Type.String(),
		authentication: Type.Object({
			credentialId: Type.String(),
			authenticatorData: Type.String(),
			clientData: Type.String(),
			signature: Type.String()
		})
	});

	const body = await request.json();
	console.log('Body: ', body);
	if (!Check(Body, body)) {
		return json({ success: false, error: 'invalid_body' }, { status: 400 });
	}

	const { challengeId, authentication } = body;
	// TODO: check for 5min max age
	const challenge = await db.query.challengeTable.findFirst({
		where: (table, { and, eq }) => and(eq(table.id, challengeId))
	});

	if (!challenge) {
		return json({ success: false, error: 'invalid_challenge' }, { status: 400 });
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
		return json({ success: false, error: 'invalid_credential' }, { status: 400 });
	}

	const expected = {
		challenge: challenge.challenge,
		origin: env.ORIGIN ?? url.origin,
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
		return json({ success: false, error: 'authentication_failed' }, { status: 400 });
	}

	const user = await db.query.userTable.findFirst({
		where: (table, { and, eq }) => and(eq(table.id, credential.userId))
	});

	if (!user) {
		return json({ success: false, error: 'unknown_user' }, { status: 400 });
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
		success: true,
		name: credential.name
	});
};
