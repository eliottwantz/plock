import { clientEnv } from '$lib/env/client';
import { EmailPasswordResetSchema } from '$lib/schemas';
import { createPasswordResetToken } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { sendPasswordResetToken } from '$lib/server/email';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	return {
		form: await superValidate(zod(EmailPasswordResetSchema))
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(EmailPasswordResetSchema));
		console.log(form);

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		try {
			const user = await db
				.selectFrom('user')
				.where('email', '=', form.data.email)
				.selectAll()
				.executeTakeFirst();
			if (!user) {
				return message(form, 'Invalid email', { status: 400 });
			}

			const verificationToken = await createPasswordResetToken(user.id);
			const verificationLink =
				clientEnv.PUBLIC_AUTH_ORIGIN + '/reset-password/' + verificationToken;

			await sendPasswordResetToken(form.data.email, verificationLink);

			return {
				form,
				success: true
			};
		} catch (error) {
			console.log('CATCHED RESET PASSWORD ERROR:\n', error);
			return message(form, 'Internal server error: Failed to reset password. Please try again.', {
				status: 500
			});
		}
	}
};
