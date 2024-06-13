<script lang="ts">
	import { env } from '$env/dynamic/public';

	let { data } = $props();
</script>

<a href="{env.PUBLIC_AUTH_ORIGIN}/login">Login</a>
<a href="{env.PUBLIC_AUTH_ORIGIN}/passkey">Account</a>
<a href="{env.PUBLIC_AUTH_ORIGIN}/logout">Logout</a>

<div>
	<pre>
        {JSON.stringify(data.cookies, null, 2)}
    </pre>
</div>
