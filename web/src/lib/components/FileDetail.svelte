<!-- lib/components/FileDetail.svelte -->
<script lang="ts">
	import { fileSelected, files } from '$lib/stores'
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

		return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
	}
</script>

<h2 class="mb-2 text-xl font-bold md:text-2xl">File Details</h2>
{#if $file}
	<div class="border-base-300 bg-base-100 rounded-field flex items-center border-2 p-4">
		<div
			class="rounded-selector mr-6 hidden h-28 w-36 shrink-0 items-center justify-center md:flex"
			class:bg-base-200={!$file.thumb}
			style={$file.thumb &&
				`background-image: url(${$file.thumb}); background-size: cover; background-position: center;`}
		>
			<span class="material-icons-round text-base-content/50" style="font-size: 3rem;">
				{$file.icon}
			</span>
		</div>
		<div class="text-base-content/70 w-0 max-w-full flex-1 truncate select-text">
			<p class="text-base-content truncate text-lg font-medium">{$file.name}</p>
			<p class="truncate text-sm">
				Size: {formatBytes($file.size)}
			</p>
			<p class="truncate text-sm">
				Type: {$file.type || 'Unknown'}
			</p>
			<p class="truncate text-sm">
				Uploaded at: <span class="font-mono">{$file.time}</span>
			</p>
			<p class="truncate text-sm">
				UUID: <span class="font-mono">{$file.id}</span>
			</p>
		</div>
	</div>
{:else}
	<p class="text-base-content/70">Please upload a file to view details.</p>
{/if}
