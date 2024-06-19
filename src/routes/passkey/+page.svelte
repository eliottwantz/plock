<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		ChallengeResponseSchema,
		ErrorResponseSchema,
		RegistrationResponseSchema
	} from '$lib/schemas';
	import { client } from '@passwordless-id/webauthn';

	let { data } = $props();
	let error = $state<string | undefined>();
	let passkeyname = $state('');
	let isLoadingChallenge = $state(false);

	const registerPasskey = async () => {
		if (isLoadingChallenge) return;

		try {
			const res = await fetch('/passkey/challenge');
			const resBody = await res.json();
			if (!res.ok) {
				const data = ErrorResponseSchema.parse(resBody);
				error = `${res.status} Failed to authenticate: ${data.error}`;
				return;
			}

			console.log(resBody);

			const parsedResponse = ChallengeResponseSchema.safeParse(resBody);
			if (!parsedResponse.success) {
				error = `Failed to authenticate: ${parsedResponse.error}`;
				return;
			}

			const registration = await client
				.register(data.user.email, parsedResponse.data.challenge, {
					authenticatorType: 'both',
					userHandle: crypto.getRandomValues(new Uint8Array(32)).toString().slice(64)
				})
				.catch((e) => {
					console.log('Error creating registration for passkey from browser', e);
					error = 'Failed to authenticate: invalid request';
					return null;
				});

			if (!registration) return;

			const registerResponse = await fetch('/passkey/register', {
				method: 'POST',
				body: JSON.stringify({
					challengeId: parsedResponse.data.id,
					registration,
					passkeyname
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const registerBody = await registerResponse.json();
			if (!registerResponse.ok) {
				const data = ErrorResponseSchema.parse(registerBody);
				error = `Failed to authenticate: ${data.error}`;
				return;
			}

			const parseRegisterResponse = RegistrationResponseSchema.safeParse(registerBody);
			if (!parseRegisterResponse.success) {
				console.log(parseRegisterResponse.error.issues);
				error = `Failed to authenticate: ${parseRegisterResponse.error.flatten()}`;
				return;
			}

			console.log({ credentialId: registerBody.id, name: registerBody.name, registration });
			await invalidateAll();
		} catch (e) {
			console.log(e);
			error = 'Failed to authenticate: unknown reason';
		} finally {
			isLoadingChallenge = false;
		}
	};
</script>

<h1 class="mb-10 text-center text-3xl font-semibold">Passkey</h1>

{#if data.passkeys.length}
	<ul class="mb-6 flex flex-col gap-y-4">
		{#each data.passkeys as passkeys}
			<li class="flex flex-col">
				<div class="flex items-center gap-x-3">
					<span>{passkeys.name}</span>
					<form action="?/delete" method="post" use:enhance>
						<input type="hidden" name="id" value={passkeys.id} />
						<button class="flex items-center gap-x-1">
							<div class="text-red-500">X</div>
							<span>Delete</span>
						</button>
					</form>
				</div>
				<small>Created at: {new Date(passkeys.createdAt).toLocaleString()}</small>
			</li>
		{/each}
	</ul>
{/if}

{#if error}
	<p class="text-red-500">{error}</p>
{/if}

<div class="mt-4 flex flex-col gap-y-4">
	<div class="flex flex-col gap-y-3">
		<Label for="passkeyname">Give a name to differentiate this passkey</Label>
		<Input id="passkeyname" bind:value={passkeyname} type="text" placeholder="John's MacBook" />
	</div>
	<Button onclick={registerPasskey}>Add passkey</Button>
</div>

<h2 class="mt-10 w-full text-center">
	Go back to <a class="underline underline-offset-2" href={env.PUBLIC_CALLBACK_URL}
		>{env.PUBLIC_SITE_NAME}</a
	>
</h2>
