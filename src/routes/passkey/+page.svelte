<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ChallengeResponse, RegistrationResponse } from '$lib/schemas';
	import { client } from '@passwordless-id/webauthn';
	import { Errors } from '@sinclair/typebox/errors';
	import { Check } from '@sinclair/typebox/value';

	let { data } = $props();
	let error = $state<string | undefined>();
	let passkeyname = $state('');
	let isLoadingChallenge = $state(false);

	const registerPasskey = async () => {
		if (isLoadingChallenge) return;

		try {
			const res = await fetch('/passkey/challenge');
			const challengeBody = await res.json();
			if (!Check(ChallengeResponse, challengeBody)) {
				console.log(Errors(ChallengeResponse, challengeBody));
				error = 'Failed to authenticate: no challenge';
				return;
			}

			if (!challengeBody.success) {
				error = `Failed to authenticate: ${challengeBody.error}`;
				return;
			}

			const registration = await client
				.register(data.user.email, challengeBody.challenge, {
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
					challengeId: challengeBody.id,
					registration,
					passkeyname
				}),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const registerBody = await registerResponse.json();
			if (!Check(RegistrationResponse, registerBody)) {
				console.log(Errors(RegistrationResponse, registerBody));
				error = 'Failed to authenticate: invalid request';
				return;
			}
			if (!registerBody.success) {
				console.log(Errors(RegistrationResponse, registerBody));
				error = `Failed to authenticate: ${registerBody.error}`;
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

<h1 class="mb-4 text-3xl font-semibold">Passkey</h1>

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

<h2 class="text-xl font-semibold">Add a passkey</h2>

{#if error}
	<p class="text-red-500">{error}</p>
{/if}

<div>
	<p>Give a name to differentiate this passkey</p>
	<div class="flex items-center gap-x-3">
		<input
			class="bg-neutral-100 px-3 py-1"
			placeholder="John's MacBook"
			type="text"
			bind:value={passkeyname}
		/>
		<button
			class="rounded-md px-4 py-2 outline outline-1 outline-neutral-800"
			onclick={registerPasskey}>Add passkey</button
		>
	</div>
</div>
