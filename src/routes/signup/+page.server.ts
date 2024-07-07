import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { fail, redirect } from '@sveltejs/kit';
import { EmailPasswordRegistrationSchema } from '$lib/schemas';
import { hash } from '@node-rs/argon2';
import { generateIdFromEntropySize } from 'lucia';
import { db } from '$lib/server/db';
import { generateEmailVerificationCode, lucia } from '$lib/server/auth';
import { sendVerificationCode } from '$lib/server/email';

export const load = async () => {
	return {
		form: await superValidate(zod(EmailPasswordRegistrationSchema))
	};
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(EmailPasswordRegistrationSchema));
		console.log('form', form);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const existingUser = await db
				.selectFrom('user')
				.where('email', '=', form.data.email)
				.selectAll()
				.executeTakeFirst();
			if (existingUser) {
				return message(form, 'An account with this email already exists. Sign in instead', {
					status: 400
				});
			}

			const passwordHash = await hash(form.data.password, {
				// recommended minimum parameters
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			const userId = generateIdFromEntropySize(10);
			await db.transaction().execute(async (tx) => {
				await tx
					.insertInto('user')
					.values({
						id: userId,
						name: form.data.name,
						email: form.data.email,
						email_verified: false,
						password_hash: passwordHash,
						created_at: new Date(),
						updated_at: new Date()
					})
					.execute();

				await tx
					.insertInto('account')
					.values({
						provider: 'email',
						provider_user_id: passwordHash,
						user_id: userId,
						created_at: new Date(),
						updated_at: new Date()
					})
					.execute();

				const verificationCode = await generateEmailVerificationCode(tx, userId, form.data.email);
				await sendVerificationCode(form.data.email, verificationCode);
			});

			const session = await lucia.createSession(userId, {
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
			console.log('CATCHED SIGNUP ERROR:\n', error);
			return message(form, 'Internal server error', { status: 500 });
		}

		return redirect(302, '/email-verification');
	}
};
