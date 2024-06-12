<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		AuthenticationResponseSchema,
		ChallengeResponseSchema,
		ErrorResponseSchema
	} from '$lib/schemas';
	import { client } from '@passwordless-id/webauthn';

	let error = $state<string | undefined>();
	let didPoke = $state<boolean>(false);

	const authenticatePasskey = async () => {
		try {
			const challengeResponse = await fetch('/passkey/challenge');
			const challengeBody = await challengeResponse.json();
			if (!challengeResponse.ok) {
				const data = ErrorResponseSchema.parse(challengeBody);
				error = `Failed to get challenge for passkey creation. ${data.error}`;
				return;
			}

			const parseChallengeResponse = ChallengeResponseSchema.safeParse(challengeBody);
			if (!parseChallengeResponse.success) {
				error = `Failed to create credential: ${parseChallengeResponse.error}`;
				return;
			}

			const authentication = await client
				.authenticate([], parseChallengeResponse.data.challenge)
				.catch((e) => {
					console.log('Error authenticating passkey from browser', e);
					error = 'Failed to authenticate credential';
					return null;
				});

			didPoke = true;
			if (!authentication) return null;

			const authenticationResponse = await fetch('/passkey/authenticate', {
				method: 'POST',
				body: JSON.stringify({
					challengeId: parseChallengeResponse.data.id,
					authentication
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const authenticationBody = await authenticationResponse.json();
			if (!authenticationResponse.ok) {
				const data = ErrorResponseSchema.parse(authenticationBody);
				console.log(data.error);
				error = 'Failed to authenticate with passkey';
				return;
			}

			const parsedAuthenticationResponse =
				AuthenticationResponseSchema.safeParse(authenticationBody);
			if (!parsedAuthenticationResponse.success) {
				console.log('Failed to authenticate', parsedAuthenticationResponse.error);
				error = `Failed to create credential: ${parsedAuthenticationResponse.error}`;
				return;
			}

			await goto('/');
			await invalidateAll();
		} catch (e) {
			console.log(e);
			error = 'Failed to authenticate with passkey';
		}
	};
</script>

<h1 class="text-3xl font-semibold mb-4">Sign in</h1>
{#if error}
	<p class="text-red-500">{error}</p>
{/if}

<div class="flex flex-col gap-y-4 items-center max-w-lg">
	<a class="bg-neutral-200 px-3 py-1 rounded-md text-center w-full" href="/login/google"
		>Sign in with Google</a
	>
	<a class="bg-neutral-200 px-3 py-1 rounded-md text-center w-full" href="/login/github"
		>Sign in with Github</a
	>

	<p>or</p>

	<button class="bg-neutral-200 px-3 py-1 rounded-md w-full" onclick={authenticatePasskey}>
		Passkey
	</button>
</div>
