import type { User } from '$lib/db/schema';
import { clientEnv } from '$lib/env/client';
import { serverEnv } from '$lib/env/server';
import { EmailPasswordLoginSchema } from '$lib/schemas';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	return {
		form: await superValidate(zod(EmailPasswordLoginSchema))
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(EmailPasswordLoginSchema));
		console.log('form', form);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		let user: Pick<User, 'id' | 'password_hash' | 'two_factor_setup_done'> | undefined;
		try {
			user = await db
				.selectFrom('user')
				.where('email', '=', form.data.email)
				.select(['id', 'password_hash', 'two_factor_setup_done'])
				.executeTakeFirst();

			if (!user) {
				// NOTE:
				// Returning immediately allows malicious actors to figure out valid emails from response times,
				// allowing them to only focus on guessing passwords in brute-force attacks.
				// As a preventive measure, you may want to hash passwords even for invalid emails.
				// However, valid emails can be already be revealed with the signup page
				// and a similar timing issue can likely be found in password reset implementation.
				// It will also be much more resource intensive.
				// Since protecting against this is non-trivial,
				// it is crucial your implementation is protected against brute-force attacks with login throttling etc.
				// If emails/usernames are public, you may outright tell the user that the username is invalid.
				// return new Response('Invalid email or password', {
				// 	status: 400
				// });

				return message(form, 'Invalid email or password', { status: 400 });
			}

			if (!user.password_hash) {
				return message(
					form,
					"You didn't sign up with email/password previously, use your social account to login instead",
					{ status: 400 }
				);
			}

			const validPassword = await verify(user.password_hash, form.data.password, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			if (!validPassword) {
				return message(form, 'Invalid email or password', { status: 400 });
			}

			const session = await lucia.createSession(user.id, {
				ip: event.getClientAddress(),
				user_agent: event.request.headers.get('user-agent'),
				created_at: new Date()
			});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		} catch (error) {
			console.log('CATCHED LOGIN ERROR:\n', error);
			return message(form, 'Internal server error', { status: 500 });
		}

		if (serverEnv.ENFORCE_TWO_FACTOR === 'true' || user.two_factor_setup_done) {
			return redirect(302, '/auth/totp');
		}

		return redirect(302, clientEnv.PUBLIC_CALLBACK_URL);
	}
};
