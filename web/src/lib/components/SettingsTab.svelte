<!-- lib/components/SettingsTab.svelte -->
<script lang="ts">
	import { endpoint, maxBlobSize } from '$lib/stores'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { showToast } from '$lib/stores'

	function copyApiEndpoint() {
		navigator.clipboard.writeText($endpoint)
		showToast('API Endpoint copied to clipboard!', 'success')
	}

	function resetApiEndpoint() {
		endpoint.set(`${page.url.origin}/api`)
		showToast('API Endpoint reset to default!', 'info')
	}

	function logout() {
		localStorage.removeItem('token')
		goto('/auth/login')
		showToast('Please log in again with your credentials.', 'info')
	}
</script>

<div>
	<section class="space-y-2">
		<h2 class="text-xl font-bold">API Endpoint</h2>
		<input
			class="input input-bordered w-full"
			type="text"
			bind:value={$endpoint}
			placeholder="Enter API Endpoint"
		/>
		<div class="flex gap-2">
			<button class="btn flex-1" onclick={copyApiEndpoint}>Copy Endpoint</button>
			<button class="btn flex-1" onclick={resetApiEndpoint}>Reset Endpoint</button>
		</div>
	</section>
	<div class="divider"></div>
	<section class="space-y-2">
		<h2 class="text-xl font-bold">Account</h2>
		<button class="btn w-full" onclick={logout}>Sign out</button>
	</section>
	<div class="divider"></div>
	<section class="space-y-2">
		<h2 class="text-xl font-bold">Preview Settings</h2>
		<p class="text-sm">Max Blob Size (Bytes)</p>
		<input
			class="input input-bordered w-full"
			type="number"
			bind:value={$maxBlobSize}
			placeholder="Enter max size in bytes"
		/>
	</section>
</div>
