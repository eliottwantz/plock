<script>
	import { env } from '$env/dynamic/public';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';

	let { data, children } = $props();
</script>

<ModeWatcher />
<div>
	<nav class="mx-auto flex max-w-screen-lg items-center gap-x-3 px-4 py-1">
		<div>
			<a class="underline underline-offset-4" href="/">Home</a>
			{#if data.user}
				<a class="underline underline-offset-4" href="{env.PUBLIC_AUTH_ORIGIN}/account">Account</a>
				<a class="underline underline-offset-4" href="{env.PUBLIC_AUTH_ORIGIN}/logout">Logout</a>
			{:else}
				<a class="underline underline-offset-4" href="{env.PUBLIC_AUTH_ORIGIN}/login">Login</a>
			{/if}
		</div>
		<div id="nav-spacer" class="flex-1"></div>
		<div>
			<ThemeSwitcher />
		</div>
	</nav>
</div>

<div class="mx-auto max-w-screen-xl px-4">{@render children()}</div>
