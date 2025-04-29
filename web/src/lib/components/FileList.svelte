<!-- lib/components/FileList.svelte -->
<script lang="ts">
	import { deleteRemoteItem } from '$lib/utils/requests'
	import { token, endpoint, fileSelected, files } from '$lib/stores'
	import ListItem from '$lib/components/ListItem.svelte'

	function selectFile(id: string): void {
		fileSelected.set(id)
	}

	async function deleteFile(id: string, e: Event): Promise<void> {
		e.stopPropagation()

		const idx = $files.findIndex((f) => f.id === id)
		if (idx === -1) return

		const fileToDelete = $files[idx]
		fileToDelete.xhr?.abort?.()

		if (fileToDelete.progress === 100) {
			const ok = await deleteRemoteItem({
				id,
				endpoint: $endpoint,
				token: $token,
				resource: 'uploads',
			})
			if (!ok) return
		}

		files.update((list) => list.filter((f) => f.id !== id))

		if ($fileSelected === id) {
			const remaining = $files.filter((f) => f.id !== id)
			fileSelected.set(remaining.length > 0 ? remaining[0].id : null)
		}
	}
</script>

<div>
	<h2 class="mb-2 text-xl font-bold">File List</h2>

	{#if $files.length === 0}
		<p class="text-base-content/70">No files available yet.</p>
	{:else}
		{#each $files as file (file.id)}
			<ListItem
				progress={file.progress}
				selected={$fileSelected === file.id}
				label={file.name}
				icon={file.icon}
				id={file.id}
				type="file"
				onSelect={() => selectFile(file.id)}
				onDelete={(e: Event) => deleteFile(file.id, e)}
			/>
		{/each}
	{/if}
</div>
