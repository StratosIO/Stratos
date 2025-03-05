<script>
	import CommandPanel from '$lib/components/CommandPanel.svelte'
	import ConfigModal from '$lib/components/ConfigModal.svelte'
	import FileDetail from '$lib/components/FileDetail.svelte'
	import FileList from '$lib/components/FileList.svelte'
	import FileUploader from '$lib/components/FileUploader.svelte'
	import ServerStatus from '$lib/components/ServerStatus.svelte'
	import { showConfigModal } from '$lib/stores'
</script>

<div class="hidden h-screen md:flex">
	<aside class="flex w-sm flex-col p-6">
		<ServerStatus />
		<div class="pb-8">
			<FileUploader />
		</div>
		<FileList />
	</aside>
	<main class="flex flex-1 flex-col px-4 py-6">
		<FileDetail />
		<div class="mt-auto">
			<CommandPanel />
		</div>
	</main>
</div>

<!-- Mobile layout -->
<div class="flex h-screen flex-col md:hidden">
	<main class="p-6">
		<div><ServerStatus /></div>
		<div class="pb-8"><FileUploader /></div>
		<div class="pb-8"><FileList /></div>
		<div class="pb-8"><FileDetail /></div>
		<div><CommandPanel /></div>
	</main>
</div>

{#if $showConfigModal}
	<ConfigModal />
{/if}
