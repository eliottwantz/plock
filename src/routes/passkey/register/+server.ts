import { challengeTable, credentialTable } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { server } from '@passwordless-id/webauthn';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const POST = async ({ locals: { user }, request, url }) => {
	if (!user) {
		return json({ error: 'not_authenticated' }, { status: 403 });
	}

	const Body = z.object({
		challengeId: z.string(),
		passkeyname: z.string(),
		registration: z.object({
			username: z.literal(user.email),
			credential: z.object({
				id: z.string(),
				publicKey: z.string(),
				algorithm: z.union([z.literal('RS256'), z.literal('ES256')])
			}),
			authenticatorData: z.string(),
			clientData: z.string()
		})
	});

	try {
		const body = await request.json();
		const parsed = Body.safeParse(body);
		if (!parsed.success) {
			return json({ error: 'invalid_body' }, { status: 400 });
		}

		console.log('Body: ', parsed);
		const { challengeId, registration, passkeyname } = parsed.data;
		// TODO: check for 5min max age
		const challenge = await db.query.challengeTable.findFirst({
			where: (table, { and, eq, lte }) => and(eq(table.id, challengeId), eq(table.userId, user.id))
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

		const expected = {
			challenge: challenge.challenge,
			origin: url.origin
			// origin: env.ORIGIN
		};

		const registrationParsed = await server
			.verifyRegistration(registration, expected)
			.catch((e) => {
				console.log('Error verifying registration: ', e);
				return null;
			});

		if (!registrationParsed) {
			return json({ error: 'invalid_credential' }, { status: 400 });
		}

		const credential = await db
			.insert(credentialTable)
			.values({
				id: registrationParsed.credential.id,
				userId: user.id,
				name: passkeyname,
				publicKey: registrationParsed.credential.publicKey,
				algorithm: registrationParsed.credential.algorithm
			})
			.returning()
			.execute()
			.then((res) => res.at(0));

		if (!credential) {
			return json({ error: 'credential_not_stored' }, { status: 400 });
		}

		return json({
			id: credential.id,
			name: credential.name
		});
	} catch (e) {
		return json({ error: 'invalid_body' }, { status: 400 });
	}
};
