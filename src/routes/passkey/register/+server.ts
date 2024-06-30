import { clientEnv } from '$lib/env/client';
import { db } from '$lib/server/db';
import { server } from '@passwordless-id/webauthn';
import { json } from '@sveltejs/kit';
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
		const challenge = await db
			.selectFrom('challenge')
			.where('id', '=', challengeId)
			.where('user_id', '=', user.id)
			.selectAll()
			.executeTakeFirst();

		if (!challenge) {
			return json({ error: 'invalid_challenge' }, { status: 400 });
		}

		// Remove the challenge from the database because it is used
		await db
			.deleteFrom('challenge')
			.where('id', '=', challenge.id)
			.execute()
			.catch((e) => {
				console.log('Error deleting challenge: ', e);
			});

		const expected = {
			challenge: challenge.challenge,
			origin: clientEnv.PUBLIC_AUTH_ORIGIN ?? url.origin
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
			.insertInto('credential')
			.values({
				id: registrationParsed.credential.id,
				user_id: user.id,
				name: passkeyname,
				public_key: registrationParsed.credential.publicKey,
				algorithm: registrationParsed.credential.algorithm,
				created_at: new Date(),
				updated_at: new Date()
			})
			.returningAll()
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
		console.log('Catched error:');
		console.error(e);
		return json({ error: 'invalid_body' }, { status: 400 });
	}
};
