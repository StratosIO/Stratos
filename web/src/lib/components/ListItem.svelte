<script lang="ts">
	let { progress, selected, icon, label, onSelect, onDelete, id, type } = $props()
	import Thumbnail from '$lib/components/Thumbnail.svelte'
</script>

<li class="group relative mb-2 flex items-center">
	<button
		type="button"
		onclick={onSelect}
		class={`group-hover:bg-base-200 rounded-field relative min-w-0 flex-1 cursor-pointer p-2 transition-colors duration-200 ${
			selected ? 'bg-base-200' : ''
		} ${progress === 0 ? 'animate-pulse' : ''}`}
	>
		{#if progress !== undefined}
			<div
				class="bg-info/10 rounded-field absolute inset-0 h-full transition-all duration-200"
				style="width: {10 + progress * 0.9}%;"
				class:opacity-100={progress < 100}
				class:opacity-0={progress === 100}
			></div>
		{/if}
		<div class="relative flex items-center">
			<div class="mr-3 h-9 w-12 shrink-0">
				<Thumbnail {id} {type} {icon} />
			</div>
			<span class="text-base-content relative truncate">{label}</span>
		</div>
	</button>
	<button
		onclick={onDelete}
		class="material-icons-round text-base-content/0 hover:text-error group-hover:text-base-content/50 absolute top-1/2 right-2 -translate-y-1/2 transition-colors"
	>
		delete
	</button>
</li>
