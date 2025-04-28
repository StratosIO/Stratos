<!-- lib/components/TaskDetail.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte'
	import { taskSelected, tasks, endpoint, token, maxBlobSize } from '$lib/stores'
	import { downloadTaskResult } from '$lib/utils/requests'
	import { derived } from 'svelte/store'
	import { Tween } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'
	import { formatBytes } from '$lib/utils/details'
	import Thumbnail from '$lib/components/Thumbnail.svelte'

	const task = derived(
		[tasks, taskSelected],
		([$tasks, $taskSelected]) => $tasks[$taskSelected] || null,
	)

	const progress = new Tween(0, { duration: 400, easing: cubicOut })

	let mediaUrl = $state<string | null>(null)
	let previewType = $state<'video' | 'image' | 'audio' | null>(null)

	async function loadPreviewBlob(taskId: string) {
		try {
			const res = await fetch(`${$endpoint}/tasks/${taskId}`, {
				headers: { Authorization: `Bearer ${$token}` },
			})
			if (!res.ok) throw new Error('fetch failed')

			const blob = await res.blob()
			const mime = blob.type || ''

			let type: typeof previewType = null
			if (mime.startsWith('video/')) type = 'video'
			else if (mime.startsWith('image/')) type = 'image'
			else if (mime.startsWith('audio/')) type = 'audio'

			if (mediaUrl) URL.revokeObjectURL(mediaUrl)

			if (type) {
				mediaUrl = URL.createObjectURL(blob)
				previewType = type
			} else {
				mediaUrl = null
				previewType = null
			}
		} catch (err) {
			console.error('load preview error', err)
			if (mediaUrl) URL.revokeObjectURL(mediaUrl)
			mediaUrl = null
			previewType = null
		}
	}

	$effect(() => {
		if ($task && $task.result_size !== undefined && $task.result_size < $maxBlobSize) {
			loadPreviewBlob($task.id)
		} else {
			if (mediaUrl) URL.revokeObjectURL(mediaUrl)
			mediaUrl = null
			previewType = null
		}
	})

	$effect(() =>
		task.subscribe(($task) => {
			if ($task?.progress !== undefined) {
				progress.target = $task.progress
			}
		}),
	)

	onDestroy(() => {
		if (mediaUrl) URL.revokeObjectURL(mediaUrl)
	})
</script>

<h2 class="mb-2 text-xl font-bold md:text-2xl">Task Details</h2>

<div>
	{#if $task}
		<div class="border-base-300 bg-base-100 rounded-field flex items-center border-2 p-4">
			<div class="mr-6 hidden h-36 w-48 shrink-0 md:flex">
				<Thumbnail id={$task.id} type="task" icon="description" size="3rem" />
			</div>
			<div class="text-base-content/70 max-w-full min-w-0 flex-1 select-text">
				<p class="truncate text-lg text-sm">UUID: <span class="font-mono">{$task.id}</span></p>
				<p class="truncate text-sm">Created At: {$task.created_at}</p>
				{#if $task.updated_at}
					<p class="truncate text-sm">Updated At: {$task.updated_at}</p>
				{/if}
				{#if $task.error}
					<p class="text-error truncate text-sm">Error: {$task.error}</p>
				{/if}
				{#if $task.result_path}
					<p class="truncate text-sm">
						Result Size: {$task.result_size !== undefined
							? formatBytes($task.result_size)
							: 'Unknown'}
					</p>
					<p class="truncate text-sm">Result Path: {$task.result_path}</p>
					<p class="flex items-center gap-1 text-sm whitespace-nowrap">
						<span>Download Link:</span>
						<button
							class="text-info inline-block max-w-full cursor-pointer truncate text-left underline"
							onclick={() => downloadTaskResult($task.id)}
						>
							{$endpoint}/tasks/{$task.id}
						</button>
					</p>
				{/if}
				<div class="flex items-center gap-2">
					<p class="text-sm whitespace-nowrap">
						Progress:
						{#if $task.progress !== undefined}
							<span class="ml-2 font-mono text-xs">{$task.progress}%</span>
						{:else}
							<span class="ml-2 font-mono text-xs">0%</span>
						{/if}
					</p>
					<progress
						class="progress max-w-96 min-w-0 flex-shrink {$task.error
							? 'progress-error'
							: 'progress-info'}"
						value={$task.progress !== undefined ? progress.current : undefined}
						max="100"
					></progress>
				</div>
			</div>
		</div>

		<div class="divider m text-sm">Preview</div>
		{#if mediaUrl}
			{#if previewType === 'image'}
				<img
					src={mediaUrl}
					alt="Task preview"
					class="rounded-field bg-base-200 mx-auto max-h-96 w-full object-contain"
				/>
			{:else if previewType === 'audio'}
				<audio controls class="w-full">
					<source src={mediaUrl} />
					Your browser does not support the audio element.
				</audio>
			{:else if previewType === 'video'}
				<video controls class="bg-base-200 rounded-field mx-auto max-h-96 w-full">
					<source src={mediaUrl} />
					<track kind="captions" label="captions" />
				</video>
			{/if}
		{:else}
			<p class="text-base-content/70">
				Preview will be avaible after task completion.
				<br />
				Check <b>Preview Settings</b> if it is not showing.
			</p>
		{/if}
	{:else}
		<p class="text-base-content/70">Please select a task to view details.</p>
	{/if}
</div>
