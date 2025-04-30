<!-- lib/components/FileDetail.svelte -->
<script lang="ts">
	import { derived } from 'svelte/store'
	import { fileSelected, files } from '$lib/stores'
	import { formatBytes } from '$lib/utils/details'
	import Thumbnail from '$lib/components/Thumbnail.svelte'

	const file = derived([files, fileSelected], ([$files, $fileSelected]) =>
		$fileSelected ? ($files.find((f) => f.id === $fileSelected) ?? null) : null,
	)
</script>

<h2 class="mb-2 text-xl font-bold md:text-2xl">File Details</h2>

{#if $file}
	<div class="border-base-300 bg-base-100 rounded-field flex items-center border-2 p-4">
		<div class="mr-6 hidden h-28 w-36 shrink-0 md:flex">
			<Thumbnail id={$file.id} type="file" icon={$file.icon} size="3rem" />
		</div>
		<div class="text-base-content/70 max-w-full min-w-0 flex-1 select-text">
			<p class="truncate text-base-content text-lg font-medium">{$file.name}</p>
			<p class="truncate text-sm">
				Size: {formatBytes($file.size)}
			</p>
			<p class="truncate text-sm">
				Type: {$file.type || 'Unknown'}
			</p>
			<p class="truncate text-sm">
				Uploaded at: <span class="font-mono text-xs">{$file.time}</span>
			</p>
			<p class="truncate text-sm">
				UUID: <span class="font-mono text-xs">{$file.id}</span>
			</p>
		</div>
	</div>
{:else}
	<p class="text-base-content/70">Please upload a file to view details.</p>
{/if}
