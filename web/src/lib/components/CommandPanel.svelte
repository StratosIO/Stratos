<!-- lib/components/CommandPanel.svelte -->
<script lang="ts">
  import CommandInput from '$lib/components/CommandInput.svelte'
  import { progress, output } from '$lib/stores'
</script>

<div class="p-6">
  <div class="mb-4">
    <label for="ffmpeg" class="text-dark mb-2 block font-medium">Command:</label>
    <div class="flex w-full items-center gap-2">
      <div class="flex-1"><CommandInput /></div>
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
