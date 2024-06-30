import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { generateId } from 'lucia';

export const GET = async ({ locals: { user } }) => {
	const challenge = await db
		.insertInto('challenge')
		.values({
			id: generateId(15),
			challenge: generateState(),
			user_id: user?.id || null,
			created_at: new Date()
		})
		.returningAll()
		.execute()
		.then((res) => res.at(0));

	if (!challenge) {
		return json({ error: 'unknown_error' }, { status: 400 });
	} else {
		return json({
			id: challenge.id,
			challenge: challenge.challenge
		});
	}
};
