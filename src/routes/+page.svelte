<script lang="ts">
	let { data } = $props();
</script>

<h1 class="text-3xl font-semibold mb-4">Hello {data.user && data.user.name}!</h1>

{#if data.user}
	<div class="flex items-center gap-4">
		<img src={data.user.picture} alt="profile" width="50" height="50" />
		<div>
			<p>{data.user.id}</p>
			<p>{data.user.email}</p>
		</div>
	</div>
	<small>Created at: {new Date(data.user.createdAt).toLocaleString()}</small>
{/if}
