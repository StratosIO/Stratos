<!-- lib/components/ConfigModal.svelte -->
<script lang="ts">
	import { endpoint, showConfigModal } from '$lib/stores'
	import { get } from 'svelte/store'
	import { fade, fly } from 'svelte/transition'

	let current: string = $state(get(endpoint))

	function closeModal() {
		showConfigModal.set(false)
	}

	function saveApiEndpoint() {
		endpoint.set(current.replace(/\/$/, ''))
		closeModal()
	}
</script>

<div transition:fade={{ duration: 150 }} class="modal modal-open !transition-none">
	<div class="modal-box" transition:fly={{ y: 20, duration: 150 }}>
		<h3 class="mb-4 text-lg font-bold">Set API Endpoint</h3>
		<input
			type="text"
			bind:value={current}
			placeholder="Enter API Endpoint"
			class="input w-full transition-colors focus:outline-none"
		/>
		<div class="modal-action">
			<button onclick={closeModal} class="btn btn-ghost">Cancel</button>
			<button onclick={saveApiEndpoint} class="btn btn-primary">Save</button>
		</div>
	</div>
</div>
