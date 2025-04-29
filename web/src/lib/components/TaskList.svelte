<!-- lib/components/TaskList.svelte -->
<script lang="ts">
	import { get } from 'svelte/store'
	import { token, endpoint, taskSelected, tasks } from '$lib/stores'
	import { deleteRemoteItem, refreshTaskStatus } from '$lib/utils/requests'
	import ListItem from '$lib/components/ListItem.svelte'
	import { onDestroy } from 'svelte'

	const sources: Map<string, EventSource> = new Map()

	function startProgressStream(id: string): void {
		const es = new EventSource(`${get(endpoint)}/tasks/${id}/progress`)

		es.addEventListener('progress', (ev: MessageEvent) => {
			const v = Number.parseFloat(ev.data)
			if (Number.isNaN(v)) return

			const pct = Math.round(v * 100)
			tasks.update((all) => {
				const i = all.findIndex((t) => t.id === id)
				if (i !== -1) all[i] = { ...all[i], progress: pct }
				return all
			})

			if (pct >= 100) {
				es.close()
				sources.delete(id)
				refreshTaskStatus(id)
			}
		})

		es.onerror = () => {
			es.close()
			sources.delete(id)
			setTimeout(() => startProgressStream(id), 2000)
		}

		sources.set(id, es)
	}

	$effect(() => {
		for (const t of $tasks) {
			if (
				(t.status === 'processing' || t.status === 'pending') &&
				!sources.has(t.id) &&
				(t.progress ?? 0) < 100
			) {
				startProgressStream(t.id)
			}
		}
		for (const [id, es] of sources.entries()) {
			if (!$tasks.some((t) => t.id === id)) {
				es.close()
				sources.delete(id)
			}
		}
	})

	onDestroy(() => {
		for (const [, es] of sources) {
			es.close()
		}
		sources.clear()
	})

	async function deleteTask(id: string, e: Event): Promise<void> {
		e.stopPropagation()

		const ok = await deleteRemoteItem({
			id,
			endpoint: get(endpoint),
			token: get(token),
			resource: 'tasks',
		})
		if (!ok) return

		tasks.update((current) => current.filter((t) => t.id !== id))

		if (get(taskSelected) === id) {
			const remaining = get(tasks)
			taskSelected.set(remaining.length > 0 ? remaining[0].id : null)
		}
	}

	function selectTask(id: string): void {
		taskSelected.set(id)
	}
</script>

<div>
	<h2 class="mb-2 text-xl font-bold">Task List</h2>

	{#if $tasks.length === 0}
		<p class="text-base-content/70">No tasks available yet.</p>
	{:else}
		{#each $tasks as task (task.id)}
			<ListItem
				progress={task.progress}
				selected={$taskSelected === task.id}
				label={task.id}
				icon="cloud_sync"
				id={task.id}
				type="task"
				onSelect={() => selectTask(task.id)}
				onDelete={(e: Event) => deleteTask(task.id, e)}
			/>
		{/each}
	{/if}
</div>
