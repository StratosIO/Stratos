<!-- lib/components/FileList.svelte -->
<script lang="ts">
	import { token, endpoint, fileSelected, files } from '$lib/stores'
	import { deleteRemoteItem } from '$lib/utils/items'
	import { get } from 'svelte/store'

	async function deleteFile(index: number, e: Event): Promise<void> {
		e.stopPropagation()
		const currentFiles = get(files)
		const fileToDelete = currentFiles[index]

		fileToDelete.xhr?.abort?.()

		if (fileToDelete.progress === 100) {
			const ok = await deleteRemoteItem({
				id: fileToDelete.id,
				endpoint: get(endpoint),
				token: get(token),
				resource: 'uploads',
			})
			if (!ok) return
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
						onclick={() => selectFile(index)}
						class="group-hover:bg-base-200 rounded-field relative min-w-0 flex-1 cursor-pointer p-2 transition-colors duration-200 {$fileSelected ===
						index
							? 'bg-base-200'
							: ''} {file.progress === 0 ? 'animate-pulse' : ''}"
					>
						{#if file.progress > 0}
							<div
								class="bg-primary/20 rounded-field absolute inset-0 h-full transition-all duration-200"
								style="width: {file.progress}%;"
								class:opacity-100={file.progress < 100}
								class:opacity-0={file.progress === 100}
							></div>
						{/if}
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
							<span class="text-base-content relative truncate">{file.name}</span>
						</div>
					</button>
					<button
						onclick={(e) => deleteFile(index, e)}
						class="material-icons-round text-base-content/0 hover:text-error group-hover:text-base-content/50 absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
					>
						delete
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
