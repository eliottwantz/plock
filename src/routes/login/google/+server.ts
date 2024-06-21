import { serverEnv } from '$lib/env/server';
import { google } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { generateCodeVerifier, generateState } from 'arctic';

export const GET = async (event) => {
	const { cookies } = event;
	const state = generateState();
	cookies.set('oauth_state', state, {
		path: '/',
		secure: serverEnv.ENV === 'PROD', // set `Secure` flag in HTTPS
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	const codeVerifier = generateCodeVerifier();
	cookies.set('google_oauth_code_verifier', codeVerifier, {
		path: '/',
		secure: true,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	const url = await google.createAuthorizationURL(state, codeVerifier, {
		scopes: ['openid', 'profile', 'email']
	});

	redirect(302, url.toString());
};
