<script>
	import { enhance } from '$app/forms';
	import '../app.pcss';

	let { data, children } = $props();
</script>

<nav class="mb-2 flex items-center gap-x-3 p-4">
	<a class="underline underline-offset-4" href="/">Home</a>
	{#if data.user}
		<a class="underline underline-offset-4" href="/passkey">Passkey</a>
		<form method="post" action="/logout">
			<button class="rounded-md bg-neutral-200 px-2 py-1">Sign out</button>
		</form>
	{:else}
		<a class="underline underline-offset-4" href="/login"> Login </a>
	{/if}
</nav>

<div class="mx-auto max-w-screen-xl px-4">{@render children()}</div>
