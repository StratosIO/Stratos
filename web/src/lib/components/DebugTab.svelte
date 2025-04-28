<script lang="ts">
	import {
		endpoint,
		uptime,
		online,
		fileSelected,
		taskSelected,
		command,
		currentTab,
		counter,
		token,
		maxBlobSize,
	} from '$lib/stores'
</script>

<section class="space-y-4">
	<h2 class="text-2xl font-bold">Debug Info</h2>
	<div class="overflow-x-auto">
		<table class="table-xs table">
			<tbody>
				<tr>
					<th>API Endpoint</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$endpoint}</td>
				</tr>
				<tr>
					<th>Uptime</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$uptime} seconds</td>
				</tr>
				<tr>
					<th>Online</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$online ? 'true' : 'false'}</td>
				</tr><tr>
					<th>File Selected</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$fileSelected}</td>
				</tr>
				<tr>
					<th>Task Selected</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$taskSelected}</td>
				</tr>
				<tr>
					<th>Max Blob Size</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$maxBlobSize} bytes</td>
				</tr>
				<tr>
					<th>Command</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$command || 'null'}</td>
				</tr>
				<tr>
					<th>Current Tab</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$currentTab}</td>
				</tr>
				<tr>
					<th>Countdown</th>
					<td class="max-w-[10rem] truncate font-mono select-text">
						{$counter.countdown}
						{#if $counter.counting}(counting){/if}
					</td>
				</tr>
				<tr>
					<th>Token</th>
					<td class="max-w-[10rem] truncate font-mono select-text">{$token}</td>
				</tr>
			</tbody>
		</table>
	</div>
</section>
