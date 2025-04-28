<!-- lib/components/FileList.svelte -->
<script lang="ts">
	import { token, endpoint, fileSelected, files } from '$lib/stores'
	import { deleteRemoteItem } from '$lib/utils/requests'
	import ListItem from '$lib/components/ListItem.svelte'

	async function deleteFile(index: number, e: Event): Promise<void> {
		e.stopPropagation()
		const currentFiles = $files
		const fileToDelete = currentFiles[index]

		fileToDelete.xhr?.abort?.()

		if (fileToDelete.progress === 100) {
			const ok = await deleteRemoteItem({
				id: fileToDelete.id,
				endpoint: $endpoint,
				token: $token,
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
				return $files.length ? 0 : -1
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
	<h2 class="mb-2 text-xl font-bold">File List</h2>

	{#if $files.length === 0}
		<p class="text-base-content/70">No files available yet.</p>
	{:else}
		{#each $files as file, index (file.id)}
			<ListItem
				progress={file.progress}
				selected={$fileSelected === index}
				label={file.name}
				icon={file.icon}
				id={file.id}
				type="file"
				onSelect={() => selectFile(index)}
				onDelete={(e: Event) => deleteFile(index, e)}
			/>
		{/each}
	{/if}
</div>
