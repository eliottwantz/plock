import { generateEmailVerificationCode } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { sendVerificationCode } from '$lib/server/email';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return redirect(302, '/login');
	}

	console.log('send email verification');

	try {
		await db.transaction().execute(async (tx) => {
			// Delete any existing verification codes for this user
			await tx.deleteFrom('email_verification_code').where('user_id', '=', user.id).execute();
			const verificationCode = await generateEmailVerificationCode(tx, user.id, user.email);
			await sendVerificationCode(user.email, verificationCode);
		});
	} catch (error) {
		console.log('CATCHED EMAIL VERIFICATION ERROR:\n', error);
		return redirect(302, '/account');
	}

	return redirect(302, '/email-verification');
};
