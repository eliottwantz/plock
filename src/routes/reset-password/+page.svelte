<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { EmailPasswordResetSchema } from '$lib/schemas';
	import { LucideInbox } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data, form } = $props();
	let superF = superForm(data.form, {
		validators: zodClient(EmailPasswordResetSchema)
	});
	const { form: formData, enhance, message } = superF;
	let error = $state<string | undefined>();

	$effect(() => {
		error = $message;
	});
</script>

<div class="mx-auto flex max-w-md flex-col gap-y-4">
	<h1 class=" text-center text-3xl font-semibold">Reset password</h1>

	{#if form?.success}
		<div class="flex items-center gap-x-4">
			<LucideInbox class="h-12 w-12 text-green-500" />
			<p>
				Check your email for a password reset link. If you don't see it, check your spam folder.
			</p>
		</div>
	{:else}
		<small class="mb-4 text-center text-sm text-muted-foreground">
			Enter your email below to get a password reset link
		</small>
		{#if error}
			<p class="text-destructive">{error}</p>
		{/if}

		<div
			data-sveltekit-preload-data="false"
			class="flex w-full flex-col items-center gap-y-4 text-lg"
		>
			<form method="post" use:enhance class="flex w-full flex-col">
				<Form.Field class="space-y-1" form={superF} name="email">
					<Form.Control let:attrs>
						<Form.Label>Email</Form.Label>
						<Input {...attrs} type="email" autocomplete="email" bind:value={$formData.email} />
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="mt-2">Get password reset link</Form.Button>
			</form>
		</div>
	{/if}
</div>
