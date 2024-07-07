<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { PasswordResetSchema } from '$lib/schemas';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data } = $props();
	let form = superForm(data.form, {
		validators: zodClient(PasswordResetSchema)
	});
	const { form: formData, enhance, message } = form;
	let error = $state<string | undefined>();

	$effect(() => {
		error = $message;
	});
</script>

<div class="mx-auto flex max-w-md flex-col gap-y-4">
	<h1 class=" text-center text-3xl font-semibold">Reset password</h1>
	<small class="mb-4 text-center text-sm text-muted-foreground">
		Enter new password below to reset your password
	</small>
	{#if error}
		<p class="text-destructive">{error}</p>
	{/if}

	<div
		data-sveltekit-preload-data="false"
		class="flex w-full flex-col items-center gap-y-4 text-lg"
	>
		<form method="post" use:enhance class="flex w-full flex-col">
			<Form.Field class="space-y-1" {form} name="password">
				<Form.Control let:attrs>
					<Form.Label>New password</Form.Label>
					<Input
						{...attrs}
						type="password"
						autocomplete="current-password"
						bind:value={$formData.password}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field class="space-y-1" {form} name="confirmPassword">
				<Form.Control let:attrs>
					<Form.Label>Confirm Password</Form.Label>
					<Input
						{...attrs}
						type="password"
						autocomplete="off"
						bind:value={$formData.confirmPassword}
					/>
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Button class="mt-2">Reset password</Form.Button>
		</form>
	</div>
</div>
