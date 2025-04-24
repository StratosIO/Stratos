<!-- lib/components/FileUploader.svelte -->
<script lang="ts">
	import { token, endpoint, files, online, showConfigModal } from '$lib/stores'

	const selectIcon = (file: File): string => {
		if (file.type.startsWith('video/')) return 'videocam'
		if (file.type.startsWith('audio/')) return 'music_note'
		if (file.type.startsWith('image/')) return 'image'
		return 'description'
	}

	async function uploadFile(file: File, id: string) {
		const xhr = new XMLHttpRequest()
		xhr.open('POST', `${$endpoint}/uploads`)
		xhr.setRequestHeader('Authorization', `Bearer ${$token}`)

		const formData = new FormData()
		formData.append('file', file)
		formData.append('id', id)

		files.update((all) => all.map((f) => (f.id === id ? { ...f, xhr } : f)))

		xhr.upload.onprogress = ({ loaded, total }) => {
			if (total) {
				const progress = Math.round((loaded / total) * 100)
				files.update((all) => all.map((f) => (f.id === id ? { ...f, progress } : f)))
			}
		}

		return new Promise<void>((resolve, reject) => {
			xhr.onload = () => {
				try {
					const { success } = JSON.parse(xhr.responseText)
					success ? resolve() : reject(xhr.response)
				} catch {
					reject(xhr.response)
				}
			}
			xhr.onerror = () => reject(xhr.response)
			xhr.send(formData)
		})
	}

	async function readFile(fileList: FileList | File[]) {
		for (const file of Array.from(fileList)) {
			const id = crypto.randomUUID()

			files.update((current) => [
				...current,
				{
					id,
					name: file.name,
					size: file.size,
					type: file.type,
					time: new Date().toISOString(),
					icon: selectIcon(file),
					progress: 0,
				},
			])

			if ($online) {
				uploadFile(file, id).catch(() => {})
			} else {
				showConfigModal.set(true)
				const unsub = online.subscribe((v) => {
					if (v) {
						unsub()
						uploadFile(file, id).catch(() => {})
					}
				})
			}
		}
	}

	const handleDrop = async (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.dataTransfer?.files.length) {
			await readFile(e.dataTransfer.files)
		}
	}
</script>

<svelte:window
	ondragenter={(e) => e.preventDefault()}
	ondragleave={(e) => e.preventDefault()}
	ondragover={(e) => e.preventDefault()}
	ondrop={handleDrop}
/>

<div class="form-control">
	<input
		id="file-input"
		type="file"
		accept="*/*"
		multiple
		class="file-input w-full transition-colors"
		onchange={(e) => readFile((e.target as HTMLInputElement).files!)}
	/>
</div>
