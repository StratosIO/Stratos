<!-- lib/components/Thumbnail.svelte -->
<script lang="ts">
	import { endpoint, token } from '$lib/stores'

	let {
		id,
		type = 'file',
		icon = 'image',
		size = '',
	} = $props<{
		id?: string
		type?: 'file' | 'task'
		icon?: string
		size?: string
	}>()

	let thumbnailSrc = $state<string | null>(null)
	let showFallback = $state(true)

	let thumbnailUrl = $derived(
		id && type
			? `${$endpoint}/${type === 'file' ? 'uploads' : 'tasks'}/thumbnails/${id}.jpg`
			: null,
	)

	const MAX_ATTEMPTS = 60
	const RETRY_DELAY = 1500

	$effect(() => {
		let cancelled = false
		let objectUrl: string | null = null

		async function poll(attempt = 0): Promise<void> {
			if (cancelled || !thumbnailUrl || !$token) return

			try {
				const response = await fetch(thumbnailUrl, {
					headers: { Authorization: `Bearer ${$token}` },
				})
				if (!response.ok) throw new Error('thumbnail not ready')

				const blob = await response.blob()
				if (blob.size === 0) throw new Error('empty blob')

				objectUrl = URL.createObjectURL(blob)
				thumbnailSrc = objectUrl
				showFallback = false
			} catch {
				if (attempt + 1 >= MAX_ATTEMPTS || cancelled) return
				await new Promise((r) => setTimeout(r, RETRY_DELAY))
				return poll(attempt + 1)
			}
		}

		poll()

		return () => {
			cancelled = true
			if (objectUrl) URL.revokeObjectURL(objectUrl)
			thumbnailSrc = null
			showFallback = true
		}
	})
</script>

<div
	class="rounded-selector bg-base-200 flex h-full w-full shrink-0 items-center justify-center overflow-hidden"
>
	{#if showFallback}
		<span class="material-icons-round text-base-content/50" style:font-size={size}>
			{icon}
		</span>
	{:else}
		<img src={thumbnailSrc} alt="thumbnail" class="h-full w-full object-cover" />
	{/if}
</div>
