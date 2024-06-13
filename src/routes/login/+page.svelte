<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { env } from '$env/dynamic/public';
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

			await goto(env.PUBLIC_CALLBACK_URL);
			await invalidateAll();
		} catch (e) {
			console.log(e);
			error = 'Failed to authenticate with passkey';
		}
	};
</script>

<div class="flex flex-col gap-y-4">
	<h1 class="mb-4 text-center text-3xl font-semibold">Sign in</h1>
	{#if error}
		<p class="text-red-500">{error}</p>
	{/if}
	<div class="flex w-full flex-col items-center gap-y-4 text-lg">
		<a
			href="/login/google"
			class="flex w-full items-center justify-center gap-x-3 rounded-md bg-neutral-100 px-3 py-1 text-neutral-900"
		>
			<span>
				<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
					<path
						d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
					/>
				</svg>
			</span>
			<span>Google</span>
		</a>

		<a
			href="/login/github"
			class="flex w-full items-center justify-center gap-x-3 rounded-md bg-neutral-100 px-3 py-1 text-neutral-900"
		>
			<span>
				<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
					<path
						d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
					/>
				</svg>
			</span>
			<span>Github</span>
		</a>

		<div class="relative w-full">
			<div class="absolute inset-0 flex items-center">
				<span class="w-full border-t"></span>
			</div>
			<div class="relative flex justify-center text-xs uppercase">
				<span class="text-muted-foreground bg-neutral-800 px-2">Or continue with</span>
			</div>
		</div>

		<button
			class="flex w-full items-center justify-center gap-x-2 rounded-md bg-neutral-100 px-3 py-1 text-neutral-900"
			onclick={authenticatePasskey}
		>
			<span>
				<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
					><path
						fill="currentColor"
						d="M3 20v-2.8q0-.85.438-1.562T4.6 14.55q1.55-.775 3.15-1.162T11 13q.5 0 1 .038t1 .112q-.1 1.45.525 2.738T15.35 18v2zm16 3l-1.5-1.5v-4.65q-1.1-.325-1.8-1.237T15 13.5q0-1.45 1.025-2.475T18.5 10t2.475 1.025T22 13.5q0 1.125-.638 2t-1.612 1.25L21 18l-1.5 1.5L21 21zm-8-11q-1.65 0-2.825-1.175T7 8t1.175-2.825T11 4t2.825 1.175T15 8t-1.175 2.825T11 12m7.5 2q.425 0 .713-.288T19.5 13t-.288-.712T18.5 12t-.712.288T17.5 13t.288.713t.712.287"
					/></svg
				>
			</span>
			<span>Passkey</span>
		</button>

		<!-- <a
			href="/login/google"
			class="flex w-full justify-center rounded-md bg-neutral-100 px-3 py-1 text-neutral-900"
		>
			<div class="relative w-min">
				<span>Google</span>
				<span class="absolute -left-11 top-0.5">
					<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
						<path
							d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
						/>
					</svg>
				</span>
			</div>
		</a>

		<a
			href="/login/github"
			class="flex w-full justify-center rounded-md bg-neutral-100 px-3 py-1 text-neutral-900"
		>
			<div class="relative w-min">
				<span>Github</span>
				<span class="absolute -left-11 top-0.5">
					<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
						<path
							d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
						/>
					</svg>
				</span>
			</div>
		</a>
		<p>or</p>
		<button
			class="flex w-full items-center justify-center gap-x-4 rounded-md bg-neutral-100 px-3 py-1 text-neutral-900"
			onclick={authenticatePasskey}
		>
			<div class="relative w-min">
				<span>Passkey</span>

				<span class="absolute -left-11 top-0">
					<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"
						><path
							fill="currentColor"
							d="M3 20v-2.8q0-.85.438-1.562T4.6 14.55q1.55-.775 3.15-1.162T11 13q.5 0 1 .038t1 .112q-.1 1.45.525 2.738T15.35 18v2zm16 3l-1.5-1.5v-4.65q-1.1-.325-1.8-1.237T15 13.5q0-1.45 1.025-2.475T18.5 10t2.475 1.025T22 13.5q0 1.125-.638 2t-1.612 1.25L21 18l-1.5 1.5L21 21zm-8-11q-1.65 0-2.825-1.175T7 8t1.175-2.825T11 4t2.825 1.175T15 8t-1.175 2.825T11 12m7.5 2q.425 0 .713-.288T19.5 13t-.288-.712T18.5 12t-.712.288T17.5 13t.288.713t.712.287"
						/></svg
					>
				</span>
			</div>
		</button> -->
	</div>
</div>
