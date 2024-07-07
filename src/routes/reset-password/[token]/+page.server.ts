import { isWithinExpirationDate } from 'oslo';
import { hash } from '@node-rs/argon2';
import { sha256 } from 'oslo/crypto';
import { encodeHex } from 'oslo/encoding';
import { db } from '$lib/server/db';
import { lucia } from '$lib/server/auth';
import { PasswordResetSchema } from '$lib/schemas';
import { redirect } from '@sveltejs/kit';
import { fail, message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	return {
		form: await superValidate(zod(PasswordResetSchema))
	};
};

export const actions = {
	default: async (event) => {
		const { params, cookies, request } = event;

		const form = await superValidate(request, zod(PasswordResetSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const tokenHash = encodeHex(await sha256(new TextEncoder().encode(params.token)));
			const token = await db
				.selectFrom('password_reset_token')
				.where('token_hash', '=', tokenHash)
				.selectAll()
				.executeTakeFirst();
			if (token) {
				await db.deleteFrom('password_reset_token').where('token_hash', '=', tokenHash).execute();
			}

			if (!token || !isWithinExpirationDate(token.expires_at)) {
				return message(form, 'Invalid password reset token', { status: 400 });
			}

			await lucia.invalidateUserSessions(token.user_id);
			const passwordHash = await hash(form.data.password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			await db
				.updateTable('user')
				.where('id', '=', token.user_id)
				.set({
					password_hash: passwordHash
				})
				.execute();

			const session = await lucia.createSession(token.user_id, {
				ip: event.getClientAddress(),
				user_agent: event.request.headers.get('user-agent'),
				created_at: new Date()
			});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		} catch (error) {
			console.log('CATCHED RESET PASSWORD ERROR:\n', error);
			return message(form, 'Failed to reset password', { status: 500 });
		}

		return redirect(302, '/account');
	}
};
