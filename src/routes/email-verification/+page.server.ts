import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { otpSchema } from './otpschema';
import { fail } from '@sveltejs/kit';

export const load = async () => {
	return {
		form: await superValidate(zod(otpSchema))
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod(otpSchema));
		console.log(form.data);
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
	}
};
