<script lang="ts">
	import EmailVerificationIcon from '$lib/components/icons/EmailVerificationIcon.svelte';
	import OtpInput from '$lib/components/OtpInput/OtpInput.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { otpSchema } from './otpschema';
	import { enhance } from '$app/forms';

	let { form } = $props();
	let formEl: HTMLFormElement | undefined = $state();

	const submitCode = () => {
		if (!formEl) return;
		formEl.requestSubmit();
	};

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
		<p class="my-4 text-red-500">{form.error}</p>
	{/if}

	<form bind:this={formEl} method="post" use:enhance class="flex flex-col items-center gap-y-4">
		<OtpInput {submitCode} />
		<Button type="submit" class="w-full">Verify & Continue</Button>
	</form>

	<p data-sveltekit-preload-data="off" class="text-pretty text-muted-foreground">
		Didn't receive the code? <a
			href="/send-email-verification"
			class={buttonVariants({ variant: 'link' })}>Send it again</a
		>
	</p>
</div>
