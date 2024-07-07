import { clientEnv } from '$lib/env/client';
import { OtpSchema } from '$lib/schemas';
import { lucia, verifyVerificationCode } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals: { user }, cookies, getClientAddress }) => {
		if (!user) {
			return fail(401);
		}

		const form = OtpSchema.safeParse(Object.fromEntries(await request.formData()));
		console.log(form.data);
		if (!form.success) {
			return fail(400, {
				error: 'Invalid code'
			});
		}

		const code =
			form.data['code-0'] +
			form.data['code-1'] +
			form.data['code-2'] +
			form.data['code-3'] +
			form.data['code-4'] +
			form.data['code-5'] +
			form.data['code-6'] +
			form.data['code-7'];
		console.log(code);

		try {
			const validCode = await verifyVerificationCode(user, code);
			if (!validCode) {
				return fail(400, { error: 'Invalid code' });
			}

			await lucia.invalidateUserSessions(user.id);
			await db
				.updateTable('user')
				.set({ email_verified: true })
				.where('id', '=', user.id)
				.execute();

			const session = await lucia.createSession(user.id, {
				ip: getClientAddress(),
				user_agent: request.headers.get('user-agent'),
				created_at: new Date()
			});
			const sessionCookie = lucia.createSessionCookie(session.id);
			cookies.set(sessionCookie.name, sessionCookie.value, {
				path: '.',
				...sessionCookie.attributes
			});
		} catch (error) {
			console.log('CATCHED EMAIL VERIFICATION ERROR:\n', error);
			return fail(500, { error: 'Internal server error' });
		}

		return redirect(302, clientEnv.PUBLIC_CALLBACK_URL);
	}
};
