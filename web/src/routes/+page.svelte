<script>
	import CommandPanel from '$lib/components/CommandPanel.svelte'
	import FileDetail from '$lib/components/FileDetail.svelte'
	import FileList from '$lib/components/FileList.svelte'
	import TaskDetail from '$lib/components/TaskDetail.svelte'
	import TaskList from '$lib/components/TaskList.svelte'
	import FileUploader from '$lib/components/FileUploader.svelte'
	import ServerStatus from '$lib/components/ServerStatus.svelte'
	import SettingsTab from '$lib/components/SettingsTab.svelte'
	import DebugTab from '$lib/components/DebugTab.svelte'
	import TabsSelector from '$lib/components/TabsSelector.svelte'

	import { currentTab } from '$lib/stores'

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
			<TabsSelector />
			{#if $currentTab === 'Files'}
				<FileList />
				<div class="divider"></div>
				<FileDetail />
				<div class="divider"></div>
				<CommandPanel />
			{:else if $currentTab === 'Tasks'}
				<TaskList />
				<div class="divider"></div>
				<TaskDetail />
			{:else if $currentTab === 'Settings'}
				<SettingsTab />
				<div class="divider"></div>
				<CommandPanel />
			{/if}
		</main>
	</div>
{:else}
	<!-- Desktop layout -->
	<div class="flex h-screen">
		<aside class="flex max-h-screen w-sm flex-shrink-0 flex-col space-y-6 overflow-y-scroll p-6">
			<ServerStatus />
			<FileUploader />
			<TabsSelector />
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
