<script lang="ts">
	let { data } = $props();
</script>

<h1>Error Authenticating</h1>

<h2>Reason: {data.reason ?? 'Unknown'}</h2>
