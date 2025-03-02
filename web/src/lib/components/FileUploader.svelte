<!-- lib/components/FileUploader.svelte -->
<script lang="ts">
	import { endpoint, fileSelected, files, serverStatus, showConfigModal } from '$lib/stores'
	import { get } from 'svelte/store'

	let dragCounter = 0
	$: dropActive = dragCounter > 0
	let fileInput: HTMLInputElement | null = null

	const getFileIcon = (file: File): string => {
		if (file.type.startsWith('video/')) return 'videocam'
		if (file.type.startsWith('audio/')) return 'music_note'
		if (file.type.startsWith('image/')) return 'image'
		return 'description'
	}

	async function generateThumbnail(file: File): Promise<string | null> {
		if (!file.type.startsWith('video/')) return null
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(file)
			const video = document.createElement('video')
			video.src = url
			video.onloadedmetadata = () => {
				video.currentTime = video.duration / 2
			}
			video.onseeked = () => {
				const canvas = document.createElement('canvas')
				canvas.width = video.videoWidth
				canvas.height = video.videoHeight
				canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height)
				URL.revokeObjectURL(url)
				resolve(canvas.toDataURL('image/png'))
			}
			video.onerror = () => {
				URL.revokeObjectURL(url)
				reject('Thumbnail generation failed')
			}
		})
	}

	async function waitForServerOnline(): Promise<void> {
		return new Promise<void>((resolve) => {
			const unsubscribe = serverStatus.subscribe((status) => {
				if (status.online) {
					unsubscribe()
					resolve()
				}
			})
		})
	}

	async function uploadFile(file: File, id: string): Promise<void> {
		if (!get(serverStatus).online) {
			showConfigModal.set(true)
			await waitForServerOnline()
		}
		const path = `${get(endpoint)}/uploads`
		const formData = new FormData()
		formData.append('file', file)
		formData.append('id', id)
		const token = 'AUTH_TOKEN_PLACEHOLDER'

		return new Promise<void>((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.open('POST', path)
			xhr.setRequestHeader('Authorization', `Bearer ${token}`)
			files.update((current) => current.map((f) => (f.id === id ? { ...f, xhr } : f)))
			xhr.upload.onprogress = (event: ProgressEvent) => {
				if (event.lengthComputable) {
					const percent = Math.round((event.loaded / event.total) * 100)
					files.update((current) =>
						current.map((f) => (f.id === id ? { ...f, progress: percent } : f)),
					)
				}
			}
			xhr.onload = () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					let responseData: { success: boolean } = { success: false }
					try {
						responseData = JSON.parse(xhr.responseText)
					} catch {
						return reject(xhr.response)
					}
					if (responseData.success) {
						files.update((current) =>
							current.map((f) => (f.id === id ? { ...f, progress: 100, uploaded: true } : f)),
						)
						return resolve()
					}
				}
				return reject(xhr.response)
			}
			xhr.onerror = () => {
				reject(xhr.response)
			}
			xhr.send(formData)
		})
	}

	async function fileInfo(fileList: FileList | File[]): Promise<void> {
		await Promise.all(
			Array.from(fileList).map(async (file) => {
				const thumb = file.type.startsWith('image/')
					? URL.createObjectURL(file)
					: await generateThumbnail(file)
				const id = crypto.randomUUID()
				files.update((current) => [
					...current,
					{
						id,
						file,
						icon: thumb ? '' : getFileIcon(file),
						thumb,
						progress: 0,
						uploaded: false,
					},
				])
				uploadFile(file, id)
			}),
		)
		fileSelected.set(get(files).length > 0 ? 0 : -1)
		if (fileInput) fileInput.value = ''
	}

	const handleDrop = async (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		dragCounter = 0
		if (e.dataTransfer?.files.length) {
			await fileInfo(e.dataTransfer.files)
		}
	}

	function handleDragEnter(e: DragEvent) {
		e.preventDefault()
		dragCounter++
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault()
		dragCounter = Math.max(0, dragCounter - 1)
	}
</script>

<svelte:window
	on:dragenter={handleDragEnter}
	on:dragover={(e) => e.preventDefault()}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
/>

<div class="form-control">
	<input
		type="file"
		multiple
		accept="*/*"
		bind:this={fileInput}
		on:change={(e) => fileInfo((e.target as HTMLInputElement).files!)}
		on:drop={(e) => e.preventDefault()}
		class="file-input w-full transition-colors focus:outline-none"
		class:file-input-primary={dropActive}
	/>
</div>
