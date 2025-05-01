<!-- lib/components/Toast.svelte -->
<script lang="ts">
	import { fly } from 'svelte/transition'
	import { toast } from '$lib/stores'

	let timer: ReturnType<typeof setTimeout>

	$effect(() => {
		clearTimeout(timer)
		if ($toast) {
			timer = setTimeout(() => toast.set(null), $toast.duration)
		}
	})
</script>

<!-- Tailwind safelist -->
<span class="alert-success alert-error alert-info hidden"></span>

{#key $toast?.id ?? -1}
	<div
		class="toast toast-bottom toast-end z-50"
		in:fly={{ x: 300, duration: 300 }}
		out:fly={{ y: 30, duration: 300 }}
		style:display={$toast ? 'flex' : 'none'}
	>
		{#if $toast}
			<div class={`alert alert-${$toast.type} alert-soft max-w-sm`}>
				<span class="material-icons-round mr-1">
					{$toast.type === 'error' ? 'error' : $toast.type === 'success' ? 'check_circle' : 'info'}
				</span>
				<span>{@html $toast.message}</span>
			</div>
		{/if}
	</div>
{/key}
