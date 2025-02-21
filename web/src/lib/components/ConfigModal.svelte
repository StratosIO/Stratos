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
  transition:fade={{ duration: 200 }}
  class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
>
  <div transition:fly={{ y: 20, duration: 200 }} class="w-80 rounded-3xl bg-white p-6 shadow-lg">
    <h2 class="mb-4 text-xl font-bold">Set API Endpoint</h2>
    <input
      type="text"
      bind:value={localEndpoint}
      class="w-full rounded-full border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
    />
    <div class="mt-4 flex justify-end space-x-2">
      <button
        on:click={closeModal}
        class="rounded-full px-4 py-2 text-dark transition-colors hover:bg-gray-100"
      >
        Cancel
      </button>
      <button
        on:click={saveApiEndpoint}
        class="rounded-full bg-primary px-6 py-2 text-white transition-colors hover:bg-primary/90"
      >
        Save
      </button>
    </div>
  </div>
</div>
