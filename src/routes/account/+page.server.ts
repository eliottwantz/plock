import { credentialTable } from '$lib/db/schema';
import { db } from '$lib/server/db';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return redirect(302, '/login');
	}

	const passkeys = await db.query.credentialTable.findMany({
		where: (table, { eq }) => eq(table.userId, user.id)
	});

	return {
		user,
		passkeys
	};
};

export const actions = {
	delete: async ({ request, locals: { user } }) => {
		if (!user) {
			return fail(403, { success: false, error: 'not_authenticated' });
		}

		const Body = Type.Object({
			id: Type.String()
		});

		const body = Object.fromEntries(await request.formData());
		if (!Value.Check(Body, body)) {
			return fail(400, { success: false, error: 'invalid_body' });
		}

		const { id } = body;
		await db.delete(credentialTable).where(eq(credentialTable.id, id)).execute();

		return {
			success: true
		};
	}
};
