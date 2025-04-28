<script lang="ts">
	import { endpoint } from '$lib/stores'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'

	function saveApiEndpoint() {
		endpoint.set($endpoint.replace(/\/$/, ''))
		alert('API Endpoint saved successfully!')
	}

	function resetApiEndpoint() {
		endpoint.set(`${page.url.origin}/api`)
		alert('API Endpoint reset to default!')
	}

	function logout() {
		localStorage.removeItem('token')
		goto('/auth/login')
	}
</script>

<section class="space-y-2">
	<h2 class="text-xl font-bold">API Endpoint</h2>
	<input
		class="input input-bordered w-full"
		type="text"
		bind:value={$endpoint}
		placeholder="Enter API Endpoint"
	/>
	<div class="flex gap-2">
		<button class="btn btn-primary flex-1" onclick={saveApiEndpoint}>Save Endpoint</button>
		<button class="btn btn-secondary flex-1" onclick={resetApiEndpoint}>Reset Endpoint</button>
	</div>
</section>

<section class="space-y-2">
	<h2 class="text-xl font-bold">Account</h2>
	<button class="btn w-full" onclick={logout}>Sign out</button>
</section>
