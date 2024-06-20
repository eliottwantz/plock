<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Passkey from '$lib/components/icons/Passkey.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		ChallengeResponseSchema,
		ErrorResponseSchema,
		RegistrationResponseSchema
	} from '$lib/schemas';
	import { client } from '@passwordless-id/webauthn';
	import { LucideTrash } from 'lucide-svelte';

	let { data } = $props();
	let error = $state<string | undefined>();
	let modalError = $state<string | undefined>();
	let passkeyname = $state('');
	let isLoadingChallenge = $state(false);
	let isProcessingRegistration = $state(false);
	let dialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let passkeyIdForDeletion = $state<string | undefined>();

	const registerPasskey = async () => {
		console.log('passkeyname', passkeyname);
		if (isLoadingChallenge) return;

		isProcessingRegistration = true;
		try {
			const res = await fetch('/passkey/challenge');
			const resBody = await res.json();
			if (!res.ok) {
				const data = ErrorResponseSchema.parse(resBody);
				modalError = `${res.status} Failed to authenticate: ${data.error}`;
				return;
			}

			console.log(resBody);

			const parsedResponse = ChallengeResponseSchema.safeParse(resBody);
			if (!parsedResponse.success) {
				modalError = `Failed to authenticate: ${parsedResponse.error}`;
				return;
			}

			const registration = await client
				.register(data.user.email, parsedResponse.data.challenge, {
					authenticatorType: 'both',
					userHandle: crypto.getRandomValues(new Uint8Array(32)).toString().slice(64)
				})
				.catch((e) => {
					console.log('Error creating registration for passkey from browser', e);
					modalError = 'Failed to authenticate: invalid request';
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
				modalError = `Failed to authenticate: ${data.error}`;
				return;
			}

			const parseRegisterResponse = RegistrationResponseSchema.safeParse(registerBody);
			if (!parseRegisterResponse.success) {
				console.log(parseRegisterResponse.error.issues);
				modalError = `Failed to authenticate: ${parseRegisterResponse.error.flatten()}`;
				return;
			}

			console.log({ credentialId: registerBody.id, name: registerBody.name, registration });
			dialogOpen = false;
			await invalidateAll();
		} catch (e) {
			console.log(e);
			modalError = 'Failed to authenticate: unknown reason';
		} finally {
			isLoadingChallenge = false;
			isProcessingRegistration = false;
		}
	};
</script>

<div class="mb-10 flex items-center justify-center gap-x-4">
	<h1 class="scroll-m-20 text-4xl font-semibold tracking-tight lg:text-5xl">Account</h1>
</div>

<h2
	class="mb-4 scroll-m-20 border-b pb-3 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
>
	Passkeys
</h2>
<p>
	Passkeys are webauthn credentials that validate your identity using touch, facial recognition, a
	device password, or a PIN. They can be used as a password replacement or as a 2FA method. <Button
		variant="link"
		size="sm"
		class="text-blue-700 dark:text-blue-500/80"
		href="https://developers.google.com/identity/passkeys"
		target="_blank"
	>
		Learn more about passkeys.
	</Button>
</p>

<div class="my-4 overflow-hidden rounded-lg border-2">
	<div class="flex w-full items-center border-b-2 bg-foreground/10 px-6 py-4">
		<p>Your passkeys ({data?.passkeys?.length || 0})</p>
		<div id="passkey-menu-spacer" class="flex-1"></div>
		<Button
			disabled={isLoadingChallenge || isProcessingRegistration}
			onclick={() => (dialogOpen = true)}
		>
			Add a new passkey
		</Button>
		<Dialog.Root bind:open={dialogOpen}>
			<Dialog.Trigger />
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Add a new passkey</Dialog.Title>
					<Dialog.Description>
						This will add a new passkey to your account. You can then use it to login afterwards.
					</Dialog.Description>
				</Dialog.Header>
				<form
					onsubmit={async (e) => {
						e.preventDefault();
						await registerPasskey();
					}}
					class="mb-4 flex flex-col gap-y-2"
				>
					{#if modalError}
						<p class=" text-red-500">{modalError}</p>
					{/if}
					<div class="flex flex-col gap-y-3">
						<Label for="passkeyname">Give a name to differentiate this passkey</Label>
						<Input
							id="passkeyname"
							bind:value={passkeyname}
							type="text"
							autocomplete="off"
							placeholder="John's MacBook"
						/>
					</div>
					<div class="mt-4 flex justify-end gap-x-2">
						<Button
							type="submit"
							disabled={isLoadingChallenge || isProcessingRegistration}
							class="flex items-center gap-x-1"
						>
							<Passkey class="h-6 w-6" />
							<span>Add passkey</span>
						</Button>
					</div>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>
	{#if data.passkeys.length}
		<ul class="flex flex-col">
			{#each data.passkeys as passkey}
				<li class="flex items-center justify-between border-b-2 px-6 py-4 last:border-0">
					<div class="flex flex-col gap-y-1">
						<div class="flex items-center gap-x-3">
							<Passkey class="h-7 w-7" />
							<Badge class="w-min" variant="default">{passkey.name}</Badge>
						</div>
						<small>
							Created at: {new Date(passkey.created_at).toLocaleString()}
						</small>
					</div>
					<div>
						<Button
							disabled={isLoadingChallenge || isProcessingRegistration}
							variant="outline"
							size="icon"
							onclick={() => {
								deleteDialogOpen = true;
								passkeyIdForDeletion = passkey.id;
							}}
						>
							<LucideTrash class="pointer-events-none h-4 w-4 text-destructive" />
						</Button>
					</div>
				</li>
			{/each}
			<AlertDialog.Root bind:open={deleteDialogOpen}>
				<AlertDialog.Trigger />
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. This will permanently delete your passkey and you won't
							be able to login with it.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<form action="?/delete" method="post" use:enhance>
							<input type="hidden" name="id" value={passkeyIdForDeletion} />
							<AlertDialog.Action type="submit">
								<span>Continue</span>
							</AlertDialog.Action>
						</form>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</ul>
	{/if}
</div>

{#if error}
	<p class="text-red-500">{error}</p>
{/if}
