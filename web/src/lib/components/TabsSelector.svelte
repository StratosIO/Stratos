<!-- lib/components/TabsSelector.svelte -->
<script>
	import { currentTab } from '$lib/stores'

	const tabs = ['Files', 'Tasks', 'Settings']
</script>

<div class="tabs tabs-border">
	{#each tabs as tab}
		<input type="radio" class="tab" value={tab} bind:group={$currentTab} aria-label={tab} />
	{/each}
</div>
