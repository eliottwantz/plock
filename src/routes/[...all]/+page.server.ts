import { redirect } from '@sveltejs/kit';

export const load = async () => {
	console.log('NOT VALID PATH');
	return redirect(302, '/login');
};
