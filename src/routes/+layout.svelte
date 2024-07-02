<script>
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { clientEnv } from '$lib/env/client';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<div class="absolute right-0 top-0 p-2">
	<ThemeSwitcher />
</div>
<div class="flex h-dvh items-center justify-center px-4 sm:px-8">
	<main class="w-full max-w-screen-lg">
		{@render children()}

		<h2 class="mt-10 w-full text-center">
			Go back to <a class="underline underline-offset-2" href={clientEnv.PUBLIC_CALLBACK_URL}>
				{clientEnv.PUBLIC_SITE_NAME}
			</a>
		</h2>
	</main>
</div>
