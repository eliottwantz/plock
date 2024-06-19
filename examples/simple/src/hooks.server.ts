import { db } from '$lib/db/db';
import { sessionTable, userTable } from '$lib/db/schema';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { eq } from 'drizzle-orm';

const auth: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('auth_session');
	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	const authData = await db
		.select()
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.where(eq(sessionTable.id, sessionId))
		.limit(1)
		.execute()
		.then((res) => res.at(0));
	if (!authData) {
		event.locals.user = null;
	} else {
		event.locals.user = authData.user;
	}

	return resolve(event);
};

export const handle = sequence(auth);
