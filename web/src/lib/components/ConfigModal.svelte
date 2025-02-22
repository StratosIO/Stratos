<!-- lib/components/Modal.svelte -->
<script lang="ts">
  import { fade, fly } from 'svelte/transition'
  import { apiEndpoint, showConfigModal } from '$lib/stores'
  import { get } from 'svelte/store'

  let localEndpoint: string = get(apiEndpoint)

  function closeModal() {
    showConfigModal.set(false)
  }

  function saveApiEndpoint() {
    apiEndpoint.set(localEndpoint.replace(/\/$/, ''))
    closeModal()
  }
</script>

<div
  transition:fade={{ duration: 150 }}
  class="bg-dark/50 fixed inset-0 z-50 flex items-center justify-center"
>
  <div transition:fly={{ y: 20, duration: 200 }} class="bg-light w-80 rounded-3xl p-6 shadow-lg">
    <h2 class="mb-4 text-xl font-bold">Set API Endpoint</h2>
    <input
      type="text"
      bind:value={localEndpoint}
      class="bg-pale focus:ring-primary/50 w-full rounded-full px-4 py-2 focus:ring-2 focus:outline-hidden"
    />
    <div class="mt-4 flex justify-end space-x-2">
      <button on:click={closeModal} class="hover:bg-pale rounded-full px-4 py-2 transition-colors">
        Cancel
      </button>
      <button
        on:click={saveApiEndpoint}
        class="bg-primary text-light hover:bg-primary/90 rounded-full px-6 py-2 transition-colors"
      >
        Save
      </button>
    </div>
  </div>
</div>
