<script>
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';

	let { children } = $props();
</script>

<ModeWatcher />
<div class="flex h-dvh items-center justify-center">
	<main class="w-full max-w-md">
		{@render children()}
	</main>
</div>
