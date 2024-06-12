export const load = async ({ request }) => {
	const reason = new URL(request.url).searchParams.get('reason');
	console.log('Reason: ', reason);
	return {
		reason
	};
};
