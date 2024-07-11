import { clientEnv } from '$lib/env/client';
import { TOTPSchema } from '$lib/schemas';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { decodeHex, encodeHex } from 'oslo/encoding';
import { createTOTPKeyURI, TOTPController } from 'oslo/otp';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return redirect(302, '/login');
	}

	console.log(user);

	if (!user.two_factor_setup_done) {
		const twoFactorSecret = crypto.getRandomValues(new Uint8Array(20));
		const two_factor_secret = encodeHex(twoFactorSecret);

		await db.updateTable('user').set({ two_factor_secret }).where('id', '=', user.id).execute();

		const totpUri = createTOTPKeyURI(clientEnv.PUBLIC_SITE_NAME, user.email, twoFactorSecret);

		return {
			totpUri
		};
	}
};

export const actions = {
	validate: async ({ request, locals: { user } }) => {
		if (!user) {
			return redirect(302, '/login');
		}

		const form = TOTPSchema.safeParse(Object.fromEntries(await request.formData()));
		console.log(form.data);
		if (!form.success) {
			return fail(400, { error: 'Invalid code' });
		}

		const otp =
			form.data['code-0'] +
			form.data['code-1'] +
			form.data['code-2'] +
			form.data['code-3'] +
			form.data['code-4'] +
			form.data['code-5'];

		console.log(otp);

		const result = await db
			.selectFrom('user')
			.where('id', '=', user.id)
			.selectAll()
			.executeTakeFirst();

		if (!result) {
			return redirect(302, '/login');
		}

		const validOTP = await new TOTPController().verify(otp, decodeHex(result.two_factor_secret!));
		if (!validOTP) {
			return fail(400, { error: 'Invalid code' });
		}

		if (!user.two_factor_setup_done) {
			await db
				.updateTable('user')
				.set({ two_factor_setup_done: true })
				.where('id', '=', user.id)
				.execute();
		}

		return redirect(302, clientEnv.PUBLIC_CALLBACK_URL);
	}
};
