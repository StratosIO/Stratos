<script>
	import CommandPanel from '$lib/components/CommandPanel.svelte'
	import ConfigModal from '$lib/components/ConfigModal.svelte'
	import FileDetail from '$lib/components/FileDetail.svelte'
	import FileList from '$lib/components/FileList.svelte'
	import TaskDetail from '$lib/components/TaskDetail.svelte'
	import TaskList from '$lib/components/TaskList.svelte'
	import FileUploader from '$lib/components/FileUploader.svelte'
	import ServerStatus from '$lib/components/ServerStatus.svelte'
	import { currentTab, showConfigModal } from '$lib/stores'

	let mobile = $state(false)

	$effect(() => {
		const update = () => {
			mobile = window.innerWidth < 768
		}

		update()
		window.addEventListener('resize', update)
		return () => window.removeEventListener('resize', update)
	})
</script>

{#if mobile}
	<!-- Mobile layout -->
	<div class="flex h-screen flex-col">
		<main class="p-6">
			<div class="mb-6"><ServerStatus /></div>
			<div class="mb-4"><FileUploader /></div>
			<div class="tabs tabs-border mb-6">
				<input type="radio" class="tab" value="files" bind:group={$currentTab} aria-label="Files" />
				<input type="radio" class="tab" value="tasks" bind:group={$currentTab} aria-label="Tasks" />
				<input type="radio" class="tab" value="other" bind:group={$currentTab} aria-label="Other" />
			</div>
			{#if $currentTab === 'files'}
				<div class="mb-8"><FileList /></div>
				<div class="mb-8"><FileDetail /></div>
				<CommandPanel />
			{:else if $currentTab === 'tasks'}
				<div class="mb-8"><TaskList /></div>
				<TaskDetail />
			{:else if $currentTab === 'other'}
				<div class="skeleton h-32 w-full"></div>
			{/if}
		</main>
	</div>
{:else}
	<!-- Desktop layout -->
	<div class="flex h-screen">
		<aside class="flex max-h-screen w-sm flex-col overflow-y-scroll p-6">
			<div class="mb-6"><ServerStatus /></div>
			<div class="mb-4"><FileUploader /></div>
			<div class="tabs tabs-border mb-6">
				<input type="radio" class="tab" value="files" bind:group={$currentTab} aria-label="Files" />
				<input type="radio" class="tab" value="tasks" bind:group={$currentTab} aria-label="Tasks" />
				<input type="radio" class="tab" value="other" bind:group={$currentTab} aria-label="Other" />
			</div>

			{#if $currentTab === 'files'}
				<FileList />
			{:else if $currentTab === 'tasks'}
				<TaskList />
			{:else if $currentTab === 'other'}
				<div class="skeleton h-32 w-full"></div>
			{/if}
		</aside>

		<main class="flex flex-1 flex-col p-6">
			{#if $currentTab === 'files'}
				<FileDetail />
				<div class="mt-auto"><CommandPanel /></div>
			{:else if $currentTab === 'tasks'}
				<TaskDetail />
			{:else if $currentTab === 'other'}
				<div class="skeleton h-32 w-full"></div>
			{/if}
		</main>
	</div>
{/if}

{#if $showConfigModal}
	<ConfigModal />
{/if}
