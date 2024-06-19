<script>
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children } = $props();
</script>

<ModeWatcher />
<div class="flex h-dvh items-center justify-center px-4 sm:px-8">
	<main class="w-full max-w-screen-lg">
		{@render children()}
	</main>
</div>
