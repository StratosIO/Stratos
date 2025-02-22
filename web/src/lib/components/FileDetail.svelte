<!-- lib/components/FileDetail.svelte -->
<script lang="ts">
  import { files, fileSelected } from '$lib/stores'
  import { derived } from 'svelte/store'

  const file = derived(
    [files, fileSelected],
    ([$files, $fileSelected]) => $files[$fileSelected] || null,
  )

  function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
  }
</script>

<h2 class="mb-4 text-xl font-bold md:text-2xl">File Details</h2>
{#if $file}
  <div class="border-mild bg-light flex items-center rounded-lg border-2 p-4">
    <div
      class="mr-6 hidden h-28 w-36 shrink-0 items-center justify-center rounded-sm md:flex"
      style={$file.thumb
        ? `background-image: url(${$file.thumb}); background-size: cover; background-position: center;`
        : 'background-color: #f3f4f6'}
    >
      <span class="material-icons text-dark/50" style="font-size: 3rem;">
        {$file.icon}
      </span>
    </div>
    <div class="text-dark/70 truncate select-text">
      <p class="text-dark truncate text-lg font-medium">{$file.file.name}</p>
      <p class="truncate text-sm">
        Size: {formatBytes($file.file.size)}
      </p>
      <p class="truncate text-sm">
        Type: {$file.file.type || 'Unknown'}
      </p>
      <p class="truncate text-sm">
        Last Modified: <span class="font-mono"
          >{new Date($file.file.lastModified).toISOString()}</span
        >
      </p>
      <p class="truncate text-sm">
        UUID: <span class="font-mono">{$file.id}</span>
      </p>
    </div>
  </div>
{:else}
  <p class="text-dark/70">Please upload a file to view details.</p>
{/if}
