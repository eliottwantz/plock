export const load = async ({ cookies }) => {
	console.log('Cookies:', cookies.getAll());
	return {
		cookies: cookies.getAll()
	};
};
