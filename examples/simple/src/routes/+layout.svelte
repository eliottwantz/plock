<script>
	import { env } from '$env/dynamic/public';
	import '../app.pcss';

	let { data, children } = $props();
</script>

<nav class="mb-2 flex items-center gap-x-3 p-4">
	<a class="underline underline-offset-4" href="/">Home</a>
	{#if data.user}
		<a class="underline underline-offset-4" href="{env.PUBLIC_AUTH_ORIGIN}/passkey">Account</a>
		<a class="underline underline-offset-4" href="{env.PUBLIC_AUTH_ORIGIN}/logout">Logout</a>
	{:else}
		<a class="underline underline-offset-4" href="{env.PUBLIC_AUTH_ORIGIN}/login">Login</a>
	{/if}
</nav>

<div class="mx-auto max-w-screen-xl px-4">{@render children()}</div>
