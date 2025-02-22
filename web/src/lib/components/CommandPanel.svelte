<!-- lib/components/CommandPanel.svelte -->
<script lang="ts">
  import CommandInput from '$lib/components/CommandInput.svelte'
  import { command, progress, output, apiEndpoint } from '$lib/stores'
  import { get } from 'svelte/store'

  async function submitCommand() {

    const endpoint = `${get(apiEndpoint)}/submit`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: get(command) }),
    })

    if (!response.ok) {
      console.error('Failed to submit command')
    } else {
      console.log('Command Sent:', get(command))
    }
  }
</script>

<div class="p-6">
  <div class="mb-4">
    <label for="ffmpeg" class="text-dark mb-2 block font-medium">Command:</label>
    <div class="flex w-full items-center gap-2">
      <div class="flex-1">
        <CommandInput />
      </div>
      <button
        on:click={submitCommand}
        class="bg-pale hover:bg-dark hover:text-light shrink-0 rounded-lg px-4 py-2 transition-colors"
      >
        Submit
      </button>
    </div>
  </div>
  <div class="mb-4">
    <p class="text-dark mb-2 block font-medium">Progress:</p>
    <div
      class="bg-pale h-4 w-full rounded-full"
      role="progressbar"
      aria-valuenow={$progress}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="bg-primary h-4 rounded-full" style="width: {$progress}%"></div>
    </div>
  </div>
  <div>
    <p class="text-dark mb-2 block font-medium">Output:</p>
    <div
      class="scrollbar-hidden bg-pale text-dark w-full rounded-lg p-4 font-mono text-sm"
      style="height: 150px; overflow-y: auto;"
    >
      {$output}
    </div>
  </div>
</div>
