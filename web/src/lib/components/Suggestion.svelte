<!-- lib/components/Suggestion.svelte -->
<script lang="ts">
	let { show, items, activeIndex, renderItem, onSelect, onHover } = $props()
</script>

{#if show}
	<ul
		role="listbox"
		class="menu bg-base-100 rounded-field absolute mt-2 w-full cursor-pointer shadow"
	>
		{#if items.length > 0}
			{#each items as item, index (item.id ?? item)}
				<li
					role="option"
					tabindex="0"
					aria-selected={index === activeIndex}
					class:bg-base-300={index === activeIndex}
					class:rounded-selector={index === activeIndex}
					onpointerdown={(e) => {
						e.preventDefault()
						onSelect(item)
					}}
					onfocus={() => onHover(index)}
					onkeydown={(e) => e.key === 'Enter' && onSelect(item)}
					onmouseover={() => onHover(index)}
				>
					<button class="rounded-selector hover:bg-transparent">
						{@html renderItem(item)}
					</button>
				</li>
			{/each}
		{:else}
			<li class="text-base-content/70 px-4 py-2">No suggestions</li>
		{/if}
	</ul>
{/if}
