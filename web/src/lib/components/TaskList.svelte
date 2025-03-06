<!-- lib/components/TaskList.svelte -->
<script lang="ts">
	import { endpoint, taskSelected, tasks } from '$lib/stores'
	import { get } from 'svelte/store'
	import { onMount, onDestroy } from 'svelte'

	async function deleteTask(index: number, e: Event): Promise<void> {
		e.stopPropagation()
		const currentTasks = get(tasks)
		const taskToDelete = currentTasks[index]
		const token = 'AUTH_TOKEN_PLACEHOLDER'
		const path = `${get(endpoint)}/tasks/${taskToDelete.id}`

		try {
			const response = await fetch(path, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			})
			const result = await response.json()
			if (!response.ok) {
				console.error('Task deletion failed:', result)
				return
			}
			console.log('Task deleted successfully:', result)
			// only remove from store if deletion was successful
			tasks.update(current => {
				const newTasks = [...current]
				newTasks.splice(index, 1)
				return newTasks
			})
			taskSelected.update(currentIndex => {
				if (currentIndex === index) {
					return get(tasks).length ? 0 : -1
				}
				if (currentIndex > index) {
					return currentIndex - 1
				}
				return currentIndex
			})
		} catch (error) {
			console.error('Error deleting task:', error)
		}
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

	onMount(() => {
		intervalId = setInterval(pollTaskStatus, 5000)
	})

	onDestroy(() => {
		clearInterval(intervalId)
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
						on:click={() => selectTask(index)}
					>
						<div class="relative flex items-center">
							<div
								class="rounded-selector bg-base-200 mr-3 flex h-9 w-12 shrink-0 items-center justify-center"
							>
								<span class="material-icons-round text-base-content/50 text-3xl">cloud_sync</span>
							</div>
							<span class="text-base-content relative truncate">{task.id}</span>
						</div>
					</button>
					<button
						on:click={(e) => deleteTask(index, e)}
						class="material-icons-round text-base-content/0 hover:text-error group-hover:text-base-content/50 absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
					>
						delete
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
