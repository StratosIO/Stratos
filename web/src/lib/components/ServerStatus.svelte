<!-- lib/components/ServerStatus.svelte -->
<script lang="ts">
	import { online, uptime, counter, currentTab } from '$lib/stores'

	const openSettings = () => currentTab.set('Settings')
</script>

<button
	type="button"
	onclick={openSettings}
	class="bg-base-200 rounded-field flex w-full cursor-pointer items-center p-6"
>
	<div class="flex items-center">
		{#if $online}
			<div class="status status-success mr-3 animate-bounce"></div>
		{:else if $counter.counting}
			<div class="mr-3 inline-grid *:[grid-area:1/1]">
				<div class="status status-error animate-ping"></div>
				<div class="status status-error"></div>
			</div>
		{:else}
			<span class="status status-warning mr-3"></span>
		{/if}

		<span class="text-base-content mt-1 truncate">
			{#if $online}
				Server Online&ensp;·&ensp; Uptime&ensp;·&ensp;
				<span class="font-mono text-sm">
					{new Date($uptime * 1000).toISOString().substring(11, 19)}
				</span>
			{:else if $counter.counting}
				Action Required - Reconnect in
				<span class="countdown">
					<span style="--value:{$counter.countdown};">
						{$counter.countdown}
					</span>
				</span>
			{:else}
				Action Required - Reconnecting...
			{/if}
		</span>
	</div>
</button>
