<!-- routes/+layout.svelte -->
<script lang="ts">
	import '../app.css'
	import 'material-icons/iconfont/material-icons.css'
	import { fetchUserData, initializeStatusMonitor } from '$lib/utils/requests'
	import { online, endpoint } from '$lib/stores'
	import { page } from '$app/state'

	const { children } = $props()
	let wasOnline = false

	if ($endpoint === '/api') {
		endpoint.set(`${page.url.origin}/api`)
	}

	$effect(initializeStatusMonitor)

	$effect(() => {
		const isAuthPath = page.url.pathname.startsWith('/auth')
		if ($online && !isAuthPath && !wasOnline) {
			fetchUserData().then((success) => {
				if (!success) {
					window.location.href = '/auth/login'
				}
			})
		}
		wasOnline = $online
	})
</script>

{@render children()}
