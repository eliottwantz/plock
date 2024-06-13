import { env } from '$env/dynamic/public';
import { lucia } from '$lib/server/auth';
import { error, fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals, cookies }) => {
	console.log('You want to logout in +page.server!!!', 'session ?', locals.session !== null);
	if (!locals.session) {
		console.log('HERE');
		return error(401, 'Unauthorized');
	}
	await lucia.invalidateSession(locals.session.id);
	const sessionCookie = lucia.createBlankSessionCookie();
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});
	redirect(302, env.PUBLIC_LOGOUT_URL);
};
