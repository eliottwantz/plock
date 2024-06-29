import { clientEnv } from '$lib/env/client';
import { db } from '$lib/server/db';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return redirect(302, '/login');
	}

	const passkeys = await db
		.selectFrom('credential')
		.where('user_id', '=', user.id)
		.selectAll()
		.execute();

	return {
		user,
		passkeys
	};
};

export const actions = {
	deleteAccount: async ({ locals: { user } }) => {
		if (!user) {
			return fail(403, { success: false, error: 'not_authenticated' });
		}

		await db.deleteFrom('user').where('id', '=', user.id).execute();

		return redirect(302, clientEnv.PUBLIC_CALLBACK_URL);
	},
	deletePasskey: async ({ request, locals: { user } }) => {
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
		await db.deleteFrom('credential').where('id', '=', id).execute();

		return {
			success: true
		};
	}
};
