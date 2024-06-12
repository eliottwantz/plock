import { challengeTable } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';
import { generateState } from 'arctic';
import { generateId } from 'lucia';

export const GET = async ({ locals: { user } }) => {
	const challenge = await db
		.insert(challengeTable)
		.values({
			id: generateId(15),
			challenge: generateState(),
			userId: user?.id
		})
		.returning()
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
