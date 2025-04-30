<script lang="ts">
	import { onDestroy } from 'svelte'
	import { derived } from 'svelte/store'
	import { files, tasks, taskSelected, endpoint, token, maxBlobSize, showToast } from '$lib/stores'
	import { Tween } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'
	import type { TaskItem } from '$lib/types'
	import { formatBytes } from '$lib/utils/details'
	import { downloadTaskResult } from '$lib/utils/requests'
	import Thumbnail from '$lib/components/Thumbnail.svelte'

	const task = derived([tasks, taskSelected], ([$tasks, $taskSelected]) =>
		$taskSelected ? ($tasks.find((t) => t.id === $taskSelected) ?? null) : null,
	)

	let mediaUrl = $state<string | null>(null)
	let mediaType = $state<'video' | 'image' | 'audio' | null>(null)
	const progress = new Tween(0, { duration: 400, easing: cubicOut })

	function revokeMediaUrl() {
		if (mediaUrl) {
			URL.revokeObjectURL(mediaUrl)
			mediaUrl = null
			mediaType = null
		}
	}

	function detectmediaType(mime: string): typeof mediaType {
		if (mime.startsWith('video/')) return 'video'
		if (mime.startsWith('image/')) return 'image'
		if (mime.startsWith('audio/')) return 'audio'
		return null
	}

	function shouldLoadPreview(task: TaskItem): boolean {
		return task?.result_size !== undefined && task.result_size < $maxBlobSize
	}

	async function loadPreviewBlob(taskId: string) {
		try {
			const response = await fetch(`${$endpoint}/tasks/${taskId}`, {
				headers: { Authorization: `Bearer ${$token}` },
			})
			if (!response.ok) throw new Error('fetch failed')

			const blob = await response.blob()
			const type = detectmediaType(blob.type || '')

			revokeMediaUrl()
			if (type) {
				mediaUrl = URL.createObjectURL(blob)
				mediaType = type
			}
		} catch (e) {
			console.error('Error loading preview', e)
			revokeMediaUrl()
		}
	}

	function replaceFileIds(command: string): string {
		const fileMap = new Map($files.map((file) => [file.id, file.name]))
		return command.replace(/[0-9a-fA-F\-]{36}/g, (id) =>
			fileMap.has(id) ? `"${fileMap.get(id)}"` : id,
		)
	}

	$effect(() => {
		if ($task && shouldLoadPreview($task)) {
			loadPreviewBlob($task.id)
		} else {
			revokeMediaUrl()
		}
	})

	$effect(() => {
		const unsubscribe = task.subscribe(($task) => {
			if ($task?.progress !== undefined) {
				progress.target = $task.progress
			}
		})
		return unsubscribe
	})

	$effect(() => {
		if ($task?.result_size !== undefined && $task.result_size >= $maxBlobSize) {
			showToast('File too large. Adjust <b>Preview Settings</b> or download instead.', 'info')
		}
	})

	onDestroy(revokeMediaUrl)
</script>

<h2 class="mb-2 text-xl font-bold md:text-2xl">Task Details</h2>

<div>
	{#if $task}
		<!-- Info -->
		<div class="border-base-300 bg-base-100 rounded-field flex items-center border-2 p-4">
			<div class="mr-6 hidden h-36 w-48 shrink-0 md:flex">
				<Thumbnail id={$task.id} type="task" icon="cloud_sync" size="3rem" />
			</div>
			<div class="text-base-content/70 max-w-full min-w-0 flex-1 select-text">
				<p class="truncate text-base-content font-mono font-bold mb-1">{replaceFileIds($task.command)}</p>
				<p class="truncate text-sm">UUID: <span class="font-mono text-xs">{$task.id}</span></p>
				<p class="truncate text-sm">Created At: {$task.created_at}</p>
				{#if $task.updated_at}
					<p class="truncate text-sm">Updated At: {$task.updated_at}</p>
				{/if}
				{#if $task.error}
					<p class="text-error truncate text-sm">Error: {$task.error}</p>
				{/if}
				{#if $task.result_size}
					<p class="truncate text-sm">
						Output Size: {formatBytes($task.result_size)}
					</p>
				{/if}
				{#if $task.result_path}
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
						<span class="ml-2 font-mono text-xs">
							{$task.progress !== undefined ? $task.progress : 0}%
						</span>
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

		<!-- Preview -->
		<div class="divider m text-sm">Preview</div>
		{#if mediaUrl}
			{#key mediaUrl}
				{#if mediaType === 'image'}
					<img
						src={mediaUrl}
						alt="Task preview"
						class="rounded-field bg-base-200 mx-auto max-h-96 w-full object-contain"
					/>
				{:else if mediaType === 'audio'}
					<audio controls class="w-full">
						<source src={mediaUrl} />
						Your browser does not support the audio element.
					</audio>
				{:else if mediaType === 'video'}
					<video controls class="bg-base-200 rounded-field mx-auto max-h-96 w-full">
						<source src={mediaUrl} />
						<track kind="captions" label="captions" />
					</video>
				{/if}
			{/key}
		{:else}
			<p class="text-base-content/70">
				Preview will be available after task completion.
				<br />
				Check <b>Preview Settings</b> if it is not showing.
			</p>
		{/if}
	{:else}
		<p class="text-base-content/70">Please select a task to view details.</p>
	{/if}
</div>
