import { serverEnv } from '$lib/env/server';
import { SMTPClient } from 'emailjs';

const client = new SMTPClient({
	user: serverEnv.SMTP_USER,
	password: serverEnv.SMTP_PASSWORD,
	host: serverEnv.SMTP_HOST,
	port: +serverEnv.SMTP_PORT,
	ssl: false
});

export const sendVerificationCode = async (email: string, code: string) => {
	console.log('sendVerificationCode', email, code);
	await client.sendAsync({
		text: `Your code is ${code}`,
		from: serverEnv.EMAIL_FROM,
		to: email,
		subject: 'Your email verification code for Plock'
	});
};
