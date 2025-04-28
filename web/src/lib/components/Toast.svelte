<script lang="ts">
	import { fly } from 'svelte/transition'

	const {
		message,
		type = 'info',
		duration = 3000,
	} = $props<{
		message: string
		type?: 'error' | 'info' | 'success'
		duration?: number
	}>()

	let show = $state(!!message)

	$effect(() => {
		if (message) {
			show = true
			const timer = setTimeout(() => {
				show = false
			}, duration)
			return () => clearTimeout(timer)
		}
		show = false
	})
</script>

{#if show}
	<span class="alert-success alert-error alert-info hidden"></span>
	<div class="toast toast-top toast-end" transition:fly={{ y: -30, duration: 300 }}>
		<div class={`alert alert-${type} alert-soft`}>
			<span class="material-icons-round">
				{#if type === 'error'}
					error
				{:else if type === 'success'}
					check_circle
				{:else}
					info
				{/if}
			</span>
			<span class="error-content">{message}</span>
		</div>
	</div>
{/if}
