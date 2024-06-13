<script lang="ts">
	import { env } from '$env/dynamic/public';

	let { data } = $props();
</script>

<a href="{env.PUBLIC_AUTH_URL}/login">Login</a>
<a href="{env.PUBLIC_AUTH_URL}/passkey">Account</a>
<a href="{env.PUBLIC_AUTH_URL}/logout">Logout</a>

<div>
	<pre>
        {JSON.stringify(data.cookies, null, 2)}
    </pre>
</div>
