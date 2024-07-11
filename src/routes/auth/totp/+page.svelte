<script lang="ts">
	import { enhance } from '$app/forms';
	import OtpInput from '$lib/components/OtpInput/OtpInput.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { LucideLoaderCircle } from 'lucide-svelte';
	import { renderSVG } from 'uqr';

	let { form, data } = $props();
	let loading = $state(false);

	$effect(() => {
		console.log('form error', form?.error);
	});
</script>

<div class="mx-auto flex max-w-md flex-col items-center gap-y-4 text-center">
	{#if data.totpUri}
		<h1 class="text-3xl font-semibold">Setup an Authenticator App</h1>
	{:else}
		<h1 class="text-3xl font-semibold">Validate your 2FA code</h1>
	{/if}
	{#if data.totpUri}
		<p class="text-pretty text-muted-foreground">
			Scan the QR code below with your authenticator app to verify your account.
		</p>

		<div class="h-full max-h-60 w-full max-w-60">
			{@html renderSVG(data.totpUri)}
		</div>

		<div data-sveltekit-preload-data="off" class="space-y-3 text-pretty text-muted-foreground">
			<div>
				<p>or click the link below:</p>
				<a href={data.totpUri} class="{buttonVariants({ variant: 'link' })} text-wrap"
					>{data.totpUri}</a
				>
			</div>

			<p>
				If none of the above options work, you can also enter the following one-time secret code:
			</p>
			<p>{new URL(data.totpUri).searchParams.get('secret')}</p>
		</div>
	{/if}

	<p class="text-pretty text-muted-foreground">
		Enter the 6 digits code from your authenticator app to verify.
	</p>

	{#if form?.error}
		<p class="my-4 text-destructive">{form.error}</p>
	{/if}

	<form
		method="post"
		action="?/validate"
		use:enhance={() => {
			loading = true;

			return async ({ update }) => {
				loading = false;
				await update({ reset: true });
			};
		}}
		class="flex flex-col items-center gap-y-4"
	>
		<OtpInput digits={6} disabled={loading} />
		<div>
			{#if loading}
				<div class="flex items-center gap-2">
					<div class="flex items-center">
						<LucideLoaderCircle class="size-5 animate-spin" />
					</div>
					<p class="text-pretty text-muted-foreground">Verifying...</p>
				</div>
			{:else}
				<Button type="submit" class="w-full">Verify & Continue</Button>
			{/if}
		</div>
	</form>
</div>
