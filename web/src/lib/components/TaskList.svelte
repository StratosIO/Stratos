<!-- lib/components/TaskList.svelte -->
<script lang="ts">
	import { endpoint, serverStatus, taskSelected, tasks } from '$lib/stores'
	import { deleteRemoteItem, fetchAllRemoteItems } from '$lib/utils/items'
	import { get } from 'svelte/store'

	async function deleteTask(index: number, e: Event): Promise<void> {
		e.stopPropagation()
		const currentTasks = get(tasks)
		const taskToDelete = currentTasks[index]

		const ok = await deleteRemoteItem({
			id: taskToDelete.id,
			endpoint: get(endpoint),
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
				return get(tasks).length ? 0 : -1
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

	// TODO: This should be replaced by SSE
	async function pollTaskStatus() {
		const currentTasks = get(tasks)
		const updatedTasks = await Promise.all(
			currentTasks.map(async (task) => {
				try {
					const res = await fetch(`${get(endpoint)}/tasks/${task.id}/status`)
					if (!res.ok) {
						console.error('Failed to fetch status for task', task.id)
						return task
					}
					const data = await res.json()
					if (data.success && data.task) {
						return data.task
					}
					return task
				} catch (error) {
					console.error('Error fetching status for task', task.id, error)
					return task
				}
			}),
		)
		tasks.set(updatedTasks)
	}

	let intervalId: ReturnType<typeof setInterval>

	$effect(() => {
		const id = setInterval(pollTaskStatus, 5000)
		return () => clearInterval(id)
	})
</script>

<div>
	<h2 class="mb-2 text-xl font-bold md:text-2xl">Task List</h2>
	{#if $tasks.length === 0}
		<p class="text-base-content/70">No tasks available yet.</p>
	{:else}
		<ul>
			{#each $tasks as task, index (task.id)}
				<li class="group relative mb-2 flex items-center">
					<button
						type="button"
						class="group-hover:bg-base-200 rounded-field relative min-w-0 flex-1 cursor-pointer p-2 transition-colors duration-200"
						class:bg-base-200={$taskSelected === index}
						onclick={() => selectTask(index)}
					>
						<div class="relative flex items-center">
							<div
								class="rounded-selector bg-base-200 mr-3 flex h-9 w-12 shrink-0 items-center justify-center"
							>
								<span class="material-icons-round text-base-content/50 text-3xl">task</span>
							</div>
							<span class="text-base-content relative truncate">{task.id}</span>
						</div>
					</button>
					<button
						onclick={(e) => deleteTask(index, e)}
						class="material-icons-round text-base-content/0 hover:text-error group-hover:text-base-content/50 absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
					>
						delete
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
