<!-- lib/components/CommandPanel.svelte -->
<script lang="ts">
  import CommandInput from '$lib/components/CommandInput.svelte'
  import { command, progress, output, apiEndpoint } from '$lib/stores'
  import { get } from 'svelte/store'

  async function submitCommand() {
    console.log('Command Input:', get(command))
    /*
    const endpoint = `${get(apiEndpoint)}/task/submit`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: get(command) }),
    })

    if (!response.ok) {
      console.error('Failed to submit command')
    } */
  }
</script>

<div class="p-6">
  <div class="mb-4">
    <label for="ffmpeg" class="mb-2 block font-medium text-dark">Command:</label>
    <div class="flex w-full items-center gap-2">
      <div class="flex-1">
        <CommandInput />
      </div>
      <button
        on:click={submitCommand}
        class="shrink-0 rounded-lg bg-pale px-4 py-2 text-dark transition-colors hover:bg-dark hover:text-light"
      >
        Submit
      </button>
    </div>
  </div>
  <div class="mb-4">
    <p class="mb-2 block font-medium text-dark">Progress:</p>
    <div
      class="h-4 w-full rounded-full bg-pale"
      role="progressbar"
      aria-valuenow={$progress}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="h-4 rounded-full bg-primary" style="width: {$progress}%"></div>
    </div>
  </div>
  <div>
    <p class="mb-2 block font-medium text-dark">Output:</p>
    <div
      class="scrollbar-hidden w-full rounded-lg bg-pale p-4 font-mono text-sm text-dark"
      style="height: 150px; overflow-y: auto;"
    >
      {$output}
    </div>
  </div>
</div>
