<!-- lib/components/TaskDetail.svelte -->
<script lang="ts">
	import { taskSelected, tasks, endpoint } from '$lib/stores'
	import { derived, get } from 'svelte/store'

	const task = derived(
		[tasks, taskSelected],
		([$tasks, $taskSelected]) => $tasks[$taskSelected] || null,
	)
</script>

<h2 class="mb-2 text-xl font-bold md:text-2xl">Task Details</h2>
{#if $task}
	<div class="border-base-300 bg-base-100 rounded-field flex flex-col gap-4 border-2 p-4">
		<div class="text-base-content/70 truncate select-text">
			<p class="truncate text-lg text-sm font-medium">
				UUID: <span class="font-mono">{$task.id}</span>
			</p>
			<p class="truncate text-sm">Status: {$task.status}</p>
			<p class="truncate text-sm">Created At: {$task.created_at}</p>
			{#if $task.updated_at}
				<p class="truncate text-sm">Updated At: {$task.updated_at}</p>
			{/if}
			{#if $task.error}
				<p class="truncate text-sm">Error: {$task.error}</p>
			{/if}
			{#if $task.result_path}
				<p class="truncate text-sm">Result Path: {$task.result_path}</p>
				<p class="truncate text-sm">
					Download Link:
					<a href="{$endpoint}/tasks/{$task.id}" target="_blank" class="text-primary-content">
						{$endpoint}/tasks/{$task.id}
					</a>
				</p>
			{/if}
		</div>
	</div>
{:else}
	<p class="text-base-content/70">Please select a task to view details.</p>
{/if}
