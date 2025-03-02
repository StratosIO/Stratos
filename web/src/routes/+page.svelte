<!-- src/routes/+page.svelte -->
<script>
	import CommandPanel from '$lib/components/CommandPanel.svelte'
	import ConfigModal from '$lib/components/ConfigModal.svelte'
	import FileDetail from '$lib/components/FileDetail.svelte'
	import FileList from '$lib/components/FileList.svelte'
	import FileUploader from '$lib/components/FileUploader.svelte'
	import ServerStatus from '$lib/components/ServerStatus.svelte'
	import { showConfigModal } from '$lib/stores'
</script>

<div class="text-base-content flex h-screen flex-col select-none md:flex-row">
	<aside class="hidden flex-col md:flex md:w-sm">
		<div class="flex-1 overflow-y-auto overflow-y-scroll p-6">
			<ServerStatus />
			<div class="mb-6"><FileUploader /></div>
			<FileList />
		</div>
	</aside>

	<div class="flex min-w-0 flex-1 flex-col">
		<!-- Mobile Only -->
		<div class="md:hidden">
			<div class="px-6 pt-4"><ServerStatus /></div>
			<div class="px-6 pb-4"><FileUploader /></div>
			<div class="px-6 py-4"><FileList /></div>
		</div>
		<div class="px-6 py-4"><FileDetail /></div>
		<div class="mt-auto"><CommandPanel /></div>
	</div>

	{#if $showConfigModal}
		<ConfigModal />
	{/if}
</div>
