<script>
	import CommandPanel from '$lib/components/CommandPanel.svelte'
	import FileDetail from '$lib/components/FileDetail.svelte'
	import FileList from '$lib/components/FileList.svelte'
	import TaskDetail from '$lib/components/TaskDetail.svelte'
	import TaskList from '$lib/components/TaskList.svelte'
	import FileUploader from '$lib/components/FileUploader.svelte'
	import ServerStatus from '$lib/components/ServerStatus.svelte'
	import { currentTab } from '$lib/stores'
	import SettingsTab from '$lib/components/SettingsTab.svelte'
	import DebugTab from '$lib/components/DebugTab.svelte'

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
		<main class="space-y-6 p-6">
			<ServerStatus />
			<FileUploader />
			<div class="tabs tabs-border">
				<input type="radio" class="tab" value="Files" bind:group={$currentTab} />
				<input type="radio" class="tab" value="Tasks" bind:group={$currentTab} />
				<input type="radio" class="tab" value="Settings" bind:group={$currentTab} />
			</div>
			{#if $currentTab === 'Files'}
				<div class="space-y-8">
					<FileList />
					<FileDetail />
				</div>
				<CommandPanel />
			{:else if $currentTab === 'Tasks'}
				<div class="space-y-8">
					<TaskList />
					<TaskDetail />
				</div>
			{:else if $currentTab === 'Settings'}
				<SettingsTab />
			{/if}
		</main>
	</div>
{:else}
	<!-- Desktop layout -->
	<div class="flex h-screen">
		<aside class="flex max-h-screen w-sm flex-shrink-0 flex-col space-y-6 overflow-y-scroll p-6">
			<ServerStatus />
			<FileUploader />
			<div class="tabs tabs-border">
				<input type="radio" class="tab" value="Files" bind:group={$currentTab} aria-label="Files" />
				<input type="radio" class="tab" value="Tasks" bind:group={$currentTab} aria-label="Tasks" />
				<input
					type="radio"
					class="tab"
					value="Settings"
					bind:group={$currentTab}
					aria-label="Settings"
				/>
			</div>
			{#if $currentTab === 'Files'}
				<FileList />
			{:else if $currentTab === 'Tasks'}
				<TaskList />
			{:else if $currentTab === 'Settings'}
				<SettingsTab />
			{/if}
		</aside>

		<main class="flex flex-1 flex-col space-y-6 p-6">
			{#if $currentTab === 'Files'}
				<FileDetail />
				<div class="mt-auto">
					<CommandPanel />
				</div>
			{:else if $currentTab === 'Tasks'}
				<TaskDetail />
			{:else if $currentTab === 'Settings'}
				<DebugTab />
				<div class="mt-auto">
					<CommandPanel />
				</div>
			{/if}
		</main>
	</div>
{/if}
