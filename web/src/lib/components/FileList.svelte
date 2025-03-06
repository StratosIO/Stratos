<!-- lib/components/FileList.svelte -->
<script lang="ts">
	import { endpoint, fileSelected, files } from '$lib/stores'
	import { get } from 'svelte/store'

	async function deleteFile(index: number, e: Event): Promise<void> {
		e.stopPropagation()
		const currentFiles = get(files)
		const fileToDelete = currentFiles[index]

		if (fileToDelete.xhr && typeof fileToDelete.xhr.abort === 'function') {
			fileToDelete.xhr.abort()
		}

		if (fileToDelete.uploaded) {
			const token = 'AUTH_TOKEN_PLACEHOLDER'
			const path = `${get(endpoint)}/uploads/${fileToDelete.id}`
			try {
				const response = await fetch(path, {
					method: 'DELETE',
					headers: { Authorization: `Bearer ${token}` },
				})
				const result = await response.json()
				if (!response.ok) {
					console.error('File deletion failed:', result)
					return
				}
				console.log('File deleted successfully:', result)
			} catch (error) {
				console.error('Error deleting file:', error)
				return
			}
		}

		files.update((current) => {
			const newFiles = [...current]
			newFiles.splice(index, 1)
			return newFiles
		})

		fileSelected.update((currentIndex) => {
			if (currentIndex === index) {
				return get(files).length ? 0 : -1
			}
			if (currentIndex > index) {
				return currentIndex - 1
			}
			return currentIndex
		})
	}

	function selectFile(index: number): void {
		fileSelected.set(index)
	}
</script>

<div>
	<h2 class="mb-2 text-xl font-bold md:text-2xl">File List</h2>
	{#if $files.length === 0}
		<p class="text-base-content/70">No files uploaded yet.</p>
	{:else}
		<ul>
			{#each $files as file, index (file.id)}
				<li class="group relative mb-2 flex items-center">
					<button
						type="button"
						on:click={() => selectFile(index)}
						class="group-hover:bg-base-200 rounded-field relative min-w-0 flex-1 cursor-pointer p-2 transition-colors duration-200 {$fileSelected ===
						index
							? 'bg-base-200'
							: ''} {!file.uploaded && file.progress === 0 ? 'animate-pulse' : ''}"
					>
						<div class="relative flex items-center">
							<div
								class="rounded-selector mr-3 flex h-9 w-12 shrink-0 items-center justify-center {!file.thumb
									? 'bg-base-200'
									: ''}"
								style={file.thumb
									? `background-image: url(${file.thumb}); background-size: cover; background-position: center;`
									: ''}
							>
								<span class="material-icons-round text-base-content/50 text-3xl">{file.icon}</span>
							</div>
							<span class="text-base-content relative truncate">{file.file.name}</span>
						</div>
					</button>
					<button
						on:click={(e) => deleteFile(index, e)}
						class="material-icons-round text-base-content/0 hover:text-error group-hover:text-base-content/50 absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
					>
						delete
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
