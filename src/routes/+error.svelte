<script lang="ts">
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
</script>

<main class="flex h-dvh flex-col items-center justify-center gap-3 text-neutral-200">
	<div class="flex items-center">
		<span class="relative -top-1 text-5xl font-thin">{$page.status}</span>
		<div class="ml-4 flex min-h-10 items-center border-l border-neutral-400 pl-4">
			<h1 class="text-lg">{$page.error?.message}</h1>
		</div>
	</div>
	<h2>
		Go back to <a class="underline underline-offset-2" href={env.PUBLIC_CALLBACK_URL}
			>{env.PUBLIC_SITE_NAME}</a
		>
	</h2>
</main>
