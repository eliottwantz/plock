<script lang="ts">
	import { enhance } from '$app/forms';
	import EmailVerificationIcon from '$lib/components/icons/EmailVerificationIcon.svelte';
	import OtpInput from '$lib/components/OtpInput/OtpInput.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { LucideLoaderCircle } from 'lucide-svelte';

	let { form } = $props();
	let loading = $state(false);

	$effect(() => {
		console.log('form error', form?.error);
	});
</script>

<div class="mx-auto flex max-w-md flex-col gap-y-4 text-center">
	<EmailVerificationIcon />

	<h1 class="text-3xl font-semibold">Please Verify Account</h1>
	<p class="text-pretty text-muted-foreground">
		Enter the 8 digit code we sent to your email address to verify your new account.
	</p>

	{#if form?.error}
		<p class="my-4 text-destructive">{form.error}</p>
	{/if}

	<form
		method="post"
		use:enhance={() => {
			loading = true;

			return async ({ update }) => {
				loading = false;
				await update({ reset: true });
			};
		}}
		class="flex flex-col items-center gap-y-4"
	>
		<OtpInput digits={8} disabled={loading} />
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

	<p data-sveltekit-preload-data="off" class="text-pretty text-muted-foreground">
		Didn't receive the code? <a
			href="/send-email-verification"
			class={buttonVariants({ variant: 'link' })}>Send it again</a
		>
	</p>
</div>
