<!-- lib/components/CommandPanel.svelte -->
<script lang="ts">
	import CommandInput from '$lib/components/CommandInput.svelte'
</script>

<div class="mb-4">
	<label for="ffmpeg" class="text-base-content mb-2 block font-medium">Command:</label>
	<div class="flex w-full items-center gap-2">
		<div class="flex-1"><CommandInput /></div>
	</div>
</div>

<div class="card rounded-field p-4 mt-4 text-sm text-base-content/80">
	<p class="font-medium">Tips:</p>
	<p>
		Press <kbd class="kbd kbd-sm">/</kbd> to enter a slash command.
	</p>
	<p>
		Press <kbd class="kbd kbd-sm">@</kbd> to mention a file from your uploads.
	</p>
</div>
