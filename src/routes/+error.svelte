<script lang="ts">
	import { page } from '$app/stores';
</script>

<main class="flex h-dvh flex-col items-center justify-center gap-3 text-muted-foreground">
	<div class="flex items-center">
		<span class="relative -top-1 text-5xl font-thin">{$page.status}</span>
		<div class="ml-4 flex min-h-10 items-center border-l border-muted-foreground pl-4">
			<h1 class="text-lg">{$page.error?.message}</h1>
		</div>
	</div>
</main>
