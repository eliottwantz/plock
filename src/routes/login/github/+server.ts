import { env } from '$lib/env/server';
import { github } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { generateState } from 'arctic';

export const GET = async (event) => {
	const { cookies } = event;
	const state = generateState();
	cookies.set('oauth_state', state, {
		path: '/',
		secure: env.ENV === 'PROD', // set `Secure` flag in HTTPS
		httpOnly: true,
		maxAge: 60 * 10, // 10 minutes
		sameSite: 'lax'
	});

	const url = await github.createAuthorizationURL(state, {
		scopes: ['user:email']
	});

	redirect(302, url.toString());
};
