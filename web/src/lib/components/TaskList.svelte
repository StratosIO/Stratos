<!-- lib/components/TaskList.svelte -->
<script lang="ts">
	import { token, endpoint, taskSelected, tasks } from '$lib/stores'
	import { deleteRemoteItem } from '$lib/utils/requests'
	import ListItem from '$lib/components/ListItem.svelte'
	import { get } from 'svelte/store'
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

		es.addEventListener('complete', () => {
			tasks.update((all) => {
				const i = all.findIndex((t) => t.id === id)
				if (i !== -1) all[i] = { ...all[i], progress: 100 }
				return all
			})
			es.close()
			sources.delete(id)
			refreshTaskStatus(id)
		})

		es.onerror = () => {
			es.close()
			sources.delete(id)
			setTimeout(() => startProgressStream(id), 2000)
		}

		sources.set(id, es)
	}

	async function refreshTaskStatus(id: string) {
		try {
			const res = await fetch(`${get(endpoint)}/tasks/${id}/status`, {
				headers: { Authorization: `Bearer ${get(token)}` },
			})
			if (!res.ok) return
			const j = await res.json()
			if (!j.success || !j.task) return

			tasks.update((all) => {
				const i = all.findIndex((t) => t.id === id)
				if (i !== -1) all[i] = { ...all[i], ...j.task, progress: 100 }
				return all
			})
		} catch (err) {
			console.error('refresh status failed:', err)
		}
	}

	$effect(() => {
		for (const t of $tasks) {
			if ((t.status === 'processing' || t.status === 'pending') && !sources.has(t.id)) {
				startProgressStream(t.id)
			} else if (t.status === 'completed' && t.progress !== 100) {
				tasks.update((all) => {
					const i = all.findIndex((x) => x.id === t.id)
					if (i !== -1) all[i] = { ...all[i], progress: 100 }
					return all
				})
			}
		}

		for (const [id, src] of sources.entries()) {
			if (!$tasks.some((t) => t.id === id)) {
				src.close()
				sources.delete(id)
			}
		}
	})

	onDestroy(() => {
		for (const [, s] of sources) {
			s.close()
		}
		sources.clear()
	})

	async function deleteTask(index: number, e: Event): Promise<void> {
		e.stopPropagation()
		const taskToDelete = $tasks[index]

		const ok = await deleteRemoteItem({
			id: taskToDelete.id,
			endpoint: $endpoint,
			token: $token,
			resource: 'tasks',
		})
		if (!ok) return

		tasks.update((current) => {
			const newTasks = [...current]
			newTasks.splice(index, 1)
			return newTasks
		})

		taskSelected.update((currentIndex) => {
			if (currentIndex === index) {
				return $tasks.length ? 0 : -1
			}
			if (currentIndex > index) {
				return currentIndex - 1
			}
			return currentIndex
		})
	}

	function selectTask(index: number): void {
		taskSelected.set(index)
	}
</script>

<div>
	<h2 class="mb-2 text-xl font-bold">Task List</h2>

	{#if $tasks.length === 0}
		<p class="text-base-content/70">No tasks available yet.</p>
	{:else}
		{#each $tasks as task, index (task.id)}
			<ListItem
				progress={task.progress}
				selected={$taskSelected === index}
				label={task.id}
				icon="cloud_sync"
				id={task.id}
				type="task"
				onSelect={() => selectTask(index)}
				onDelete={(e: Event) => deleteTask(index, e)}
			/>
		{/each}
	{/if}
</div>
