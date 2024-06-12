// import { surreal } from '@/app/(api)/lib/surreal';
// import { extractUserTokenFromRequest } from '@/app/(api)/lib/token';
// import { record } from '@/lib/zod';
// import { Challenge } from '@/schema/resources/challenge';
// import { Credential } from '@/schema/resources/credential';
// import { User } from '@/schema/resources/user';
// import { server } from '@passwordless-id/webauthn';
// import { NextRequest, NextResponse } from 'next/server';

import { challengeTable, credentialTable } from '$lib/db/schema';
import { env } from '$lib/env/server';
import { db } from '$lib/server/db';
import { server } from '@passwordless-id/webauthn';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const POST = async ({ locals: { user }, request }) => {
	if (!user) {
		return json({ success: false, error: 'not_authenticated' }, { status: 403 });
	}

	const Body = Type.Object({
		challengeId: Type.String(),
		passkeyname: Type.String(),
		registration: Type.Object({
			username: Type.Literal(user.email),
			credential: Type.Object({
				id: Type.String(),
				publicKey: Type.String(),
				algorithm: Type.Union([Type.Literal('RS256'), Type.Literal('ES256')])
			}),
			authenticatorData: Type.String(),
			clientData: Type.String()
		})
	});

	try {
		const body = await request.json();
		if (!Value.Check(Body, body)) {
			return json({ success: false, error: 'invalid_body' }, { status: 400 });
		}

		console.log('Body: ', body);
		const { challengeId, registration } = body;
		// TODO: check for 5min max age
		const challenge = await db.query.challengeTable.findFirst({
			where: (table, { and, eq, lte }) => and(eq(table.id, challengeId), eq(table.userId, user.id))
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

		const expected = {
			challenge: challenge.challenge,
			origin: env.ORIGIN
		};

		const registrationParsed = await server
			.verifyRegistration(registration, expected)
			.catch((e) => {
				console.log('Error verifying registration: ', e);
				return null;
			});

		if (!registrationParsed) {
			return json({ success: false, error: 'invalid_credential' }, { status: 400 });
		}

		const credential = await db
			.insert(credentialTable)
			.values({
				id: registrationParsed.credential.id,
				userId: user.id,
				name: body.passkeyname,
				publicKey: registrationParsed.credential.publicKey,
				algorithm: registrationParsed.credential.algorithm
			})
			.returning()
			.execute()
			.then((res) => res.at(0));

		if (!credential) {
			return json({ success: false, error: 'credential_not_stored' }, { status: 400 });
		}

		return json({
			success: true,
			id: credential.id,
			name: credential.name
		});
	} catch (e) {
		return json({ success: false, error: 'invalid_body' }, { status: 400 });
	}
};
