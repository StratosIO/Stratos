<!-- lib/components/CommandPanel.svelte -->
<script lang="ts">
	import CommandInput from '$lib/components/CommandInput.svelte'
	import { output, progress } from '$lib/stores'
</script>

<div class="p-6">
	<div class="mb-4">
		<label for="ffmpeg" class="text-base-content mb-2 block font-medium">Command:</label>
		<div class="flex w-full items-center gap-2">
			<div class="flex-1"><CommandInput /></div>
		</div>
	</div>
	<div class="mb-4">
		<p class="text-base-content mb-2 block font-medium">Progress:</p>
		<div
			class="bg-base-200 h-4 w-full rounded-full"
			role="progressbar"
			aria-valuenow={$progress}
			aria-valuemin="0"
			aria-valuemax="100"
		>
			<div class="bg-primary h-4 rounded-full" style="width: {$progress}%"></div>
		</div>
	</div>
	<div>
		<p class="text-base-content mb-2 block font-medium">Output:</p>
		<div
			class="scrollbar-hidden bg-base-200 text-base-content rounded-field h-40 w-full p-4 font-mono text-sm"
		>
			{$output}
		</div>
	</div>
</div>
