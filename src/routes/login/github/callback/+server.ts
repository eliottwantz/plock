import { clientEnv } from '$lib/env/client';
import { serverEnv } from '$lib/env/server';
import { github, handleOauthLogin } from '$lib/server/auth';
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

	let two_factor_setup_done = false;
	try {
		const tokens = await github.validateAuthorizationCode(code);
		console.log('Got tokens:', tokens);
		const githubUserResponse = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const githubUser: GitHubUserResult = await githubUserResponse.json();
		console.log('GOT GITHUB USER:\n', githubUser);

		const emailsResponse = await fetch('https://api.github.com/user/emails', {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});
		const emails: GithubEmailsResponse = await emailsResponse.json();
		console.log('Got emails:\n', emails);

		const primaryEmail = emails.find((email) => email.primary) ?? null;
		if (!primaryEmail) {
			return redirect(302, '/auth/error?reason=missing_primary_email_for_github');
		}
		if (!primaryEmail.verified) {
			return redirect(302, '/auth/error?reason=unverified_email_for_github');
		}

		const email = primaryEmail.email;

		const { cookie, twoFactorSetupDone } = await handleOauthLogin('github', {
			providerId: githubUser.id.toString(),
			email,
			name: githubUser.name,
			picture: githubUser.avatar_url,
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

type GitHubUserResult = {
	id: number;
	name: string;
	avatar_url: string;
};

type GithubEmailsResponse = Array<{
	email: string;
	verified: boolean;
	primary: boolean;
	visibility: string;
}>;
