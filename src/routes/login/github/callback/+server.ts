import { github, handleLogin } from '$lib/server/auth';
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

		const sessionCookie = await handleLogin('github', {
			providerId: githubUser.id.toString(),
			email,
			name: githubUser.name,
			picture: githubUser.avatar_url,
			ip: event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent')
		});
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
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

	return redirect(302, '/');
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
