<script>
	import '../app.pcss';

	let { data, children } = $props();
</script>

<div class="flex h-dvh items-center justify-center bg-neutral-800">
	<main class="w-full max-w-md">
		{@render children()}
	</main>
</div>
