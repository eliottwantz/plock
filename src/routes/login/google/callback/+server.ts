import { clientEnv } from '$lib/env/client';
import { serverEnv } from '$lib/env/server';
import { google, handleOauthLogin } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { OAuth2RequestError } from 'arctic';

export const GET = async (event) => {
	const {
		cookies,
		url: { searchParams }
	} = event;
	const code = searchParams.get('code');
	const state = searchParams.get('state');
	const storedState = cookies.get('oauth_state');
	const codeVerifier = cookies.get('google_oauth_code_verifier');

	if (!code || !state || !storedState || state !== storedState) {
		console.log(
			'Invalid params:',
			'\ncode:',
			code,
			'\nstate:',
			state,
			'\nstoredState:',
			storedState
		);

		return redirect(302, '/auth/error?reason=invalid_params');
	}

	if (!codeVerifier) {
		console.log('Missing code verifier');
		return redirect(302, '/auth/error?reason=missing_code_verifier');
	}

	let two_factor_setup_done = false;
	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier.toString());
		console.log('Got tokens:', tokens);
		const googleUserResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const googleUser: GoogleUserResult = await googleUserResponse.json();
		console.log('GOT GOOGLE USER', googleUser);

		const { cookie, twoFactorSetupDone } = await handleOauthLogin('google', {
			providerId: googleUser.sub,
			email: googleUser.email,
			name: googleUser.name,
			picture: googleUser.picture,
			ip: event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent')
		});
		two_factor_setup_done = twoFactorSetupDone;
		event.cookies.set(cookie.name, cookie.value, {
			path: '.',
			...cookie.attributes
		});
	} catch (e) {
		if (e instanceof OAuth2RequestError) {
			console.log('OAuth2RequestError error:\n', e);
			return redirect(302, `/auth/error?reason=${OAuth2RequestError}`);
		} else {
			console.log('Unknown error:\n', e);
			return redirect(302, '/auth/error');
		}
	}

	if (serverEnv.ENFORCE_TWO_FACTOR === 'true' || two_factor_setup_done) {
		return redirect(302, '/auth/totp');
	}

	return redirect(302, clientEnv.PUBLIC_CALLBACK_URL);
};

type GoogleUserResult = {
	sub: string;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
	email: string;
	email_verified: boolean;
	locale: string;
};
