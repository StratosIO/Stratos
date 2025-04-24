<script lang="ts">
	import { taskSelected, tasks, endpoint } from '$lib/stores'
	import { downloadTaskResult } from '$lib/utils/requests'
	import { derived } from 'svelte/store'
	import { Tween } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'

	const task = derived(
		[tasks, taskSelected],
		([$tasks, $taskSelected]) => $tasks[$taskSelected] || null,
	)

	const progress = new Tween(0, {
		duration: 400,
		easing: cubicOut,
	})

	$effect(() =>
		task.subscribe(($task) => {
			if ($task?.progress !== undefined) {
				progress.target = $task.progress
			}
		}),
	)
</script>

<h2 class="mb-2 text-xl font-bold md:text-2xl">Task Details</h2>
{#if $task}
	<div class="border-base-300 bg-base-100 rounded-field flex items-center border-2 p-4">
		<div class="text-base-content/70 max-w-full min-w-0 flex-1 select-text">
			<p class="truncate text-lg text-sm">
				UUID: <span class="font-mono">{$task.id}</span>
			</p>
			<p class="truncate text-sm">Created At: {$task.created_at}</p>
			{#if $task.updated_at}
				<p class="truncate text-sm">Updated At: {$task.updated_at}</p>
			{/if}

			{#if $task.error}
				<p class="text-error truncate text-sm">Error: {$task.error}</p>
			{/if}

			{#if $task.result_path}
				<p class="truncate text-sm">Result Path: {$task.result_path}</p>
				<p class="text-sm">
					Download Link:
					<button
						onclick={() => downloadTaskResult($task.id)}
						class="text-info inline-block max-w-full cursor-pointer truncate underline"
					>
						{$endpoint}/tasks/{$task.id}
					</button>
				</p>
			{/if}

			{#if $task.progress !== undefined}
				<div class="flex items-center gap-2">
					<p class="truncate text-sm">
						Progress:
						<span class="ml-2 font-mono text-xs">{$task.progress}%</span>
					</p>
					<progress
						class="progress mb-[2px] max-w-sm {$task.error ? 'progress-error' : 'progress-info'}"
						value={progress.current}
						max="100"
					></progress>
				</div>
			{:else if $task.progress === undefined}
				<div class="flex items-center gap-2">
					<p class="truncate text-sm">Progress: Calculating…</p>
					<progress class="progress progress-info mb-[2px] max-w-sm"></progress>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<p class="text-base-content/70">Please select a task to view details.</p>
{/if}
