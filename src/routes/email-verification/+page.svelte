<script lang="ts">
	import { enhance } from '$app/forms';
	import EmailVerificationIcon from '$lib/components/icons/EmailVerificationIcon.svelte';
	import OtpInput from '$lib/components/OtpInput/OtpInput.svelte';
	import { Button } from '$lib/components/ui/button';

	let formEl: HTMLFormElement | undefined = $state();

	const submitCode = () => {
		if (!formEl) return;
		formEl.requestSubmit();
	};
</script>

<div class="mx-auto flex max-w-md flex-col gap-y-4 text-center">
	<EmailVerificationIcon />

	<h1 class="text-3xl font-semibold">Please Verify Account</h1>
	<p class="text-pretty text-muted-foreground">
		Enter the 8 digit code we sent to your email address to verify your new account.
	</p>

	<form bind:this={formEl} method="post" use:enhance class="flex flex-col items-center gap-y-4">
		<OtpInput {submitCode} />
		<Button type="submit" class="w-full">Verify & Continue</Button>
	</form>
</div>
