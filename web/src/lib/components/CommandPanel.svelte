<!-- lib/components/CommandPanel.svelte -->
<script lang="ts">
	import CommandInput from '$lib/components/CommandInput.svelte'
</script>

<div class="mb-4">
	<label for="ffmpeg" class="text-base-content mb-2 block font-medium">Command:</label>
	<div class="flex w-full items-center gap-2">
		<div class="z-50 flex-1"><CommandInput /></div>
	</div>
	<div class="card rounded-field text-base-content/80 mt-4 mb-32 p-4 text-sm">
		<p class="font-medium">Tips:</p>
		<p>
			Press <kbd class="kbd kbd-sm">/</kbd> to enter a slash command.
		</p>
		<p>
			Press <kbd class="kbd kbd-sm">@</kbd> to mention a file from your uploads.
		</p>
	</div>
</div>
