<!-- lib/components/ServerStatus.svelte -->
<script lang="ts">
	import { endpoint, serverStatus, showConfigModal } from '$lib/stores'
	import { onDestroy, onMount } from 'svelte'
	import { get } from 'svelte/store'

	let endpointUnsubscribe: () => void
	let eventSource: EventSource | null = null
	let countdownInterval: number | undefined = undefined

	const updateServerStatus = (
		updates: Partial<{
			online: boolean
			counting: boolean
			countdown: number
			uptime: string
		}>,
	) => {
		serverStatus.update((status) => ({ ...status, ...updates }))
	}

	const resetConnection = () => {
		eventSource?.close()
		if (countdownInterval !== undefined) {
			clearInterval(countdownInterval)
			countdownInterval = undefined
		}
		updateServerStatus({ online: false, counting: false, countdown: 0 })
	}

	const setupEventSource = () => {
		resetConnection()
		eventSource = new EventSource(`${get(endpoint)}/status`)
		eventSource.onopen = () => updateServerStatus({ online: true, countdown: 10, counting: false })
		eventSource.onerror = () => {
			updateServerStatus({ online: false })
			setTimeout(() => {
				if (!get(serverStatus).counting && countdownInterval === undefined) {
					startCountdown()
				}
			}, 800)
		}
		eventSource.onmessage = (event) => {
			updateServerStatus({
				uptime: Math.floor(Number.parseFloat(event.data)).toString(),
			})
		}
	}

	const startCountdown = () => {
		if (countdownInterval !== undefined) return

		updateServerStatus({ counting: true, countdown: 10 })
		let count = 10

		countdownInterval = setInterval(() => {
			if (get(serverStatus).online || count <= 0) {
				if (countdownInterval !== undefined) {
					clearInterval(countdownInterval)
					countdownInterval = undefined
				}
				updateServerStatus({ counting: false })
				if (!get(serverStatus).online) setupEventSource()
			} else {
				updateServerStatus({ countdown: --count })
			}
		}, 1000)
	}

	onMount(() => {
		endpointUnsubscribe = endpoint.subscribe(setupEventSource)
	})

	onDestroy(() => {
		resetConnection()
		endpointUnsubscribe?.()
	})

	const openModal = () => showConfigModal.set(true)
</script>

<button
	type="button"
	on:click={openModal}
	class="bg-base-200 rounded-field mb-6 flex w-full items-center p-6"
>
	<div class="flex items-center">
		{#if $serverStatus.online}
			<div class="status status-success mr-3 animate-bounce"></div>
		{:else if $serverStatus.counting}
			<div class="mr-3 inline-grid *:[grid-area:1/1]">
				<div class="status status-error animate-ping"></div>
				<div class="status status-error"></div>
			</div>
		{:else}
			<span class="status status-warning mr-3"></span>
		{/if}
		<span class="text-base-content mt-1 truncate">
			{#if $serverStatus.online}
				Server Online - Uptime: {$serverStatus.uptime}
			{:else if $serverStatus.counting}
				Action Required - Reconnect in
				<span class="countdown">
					<span style="--value:{$serverStatus.countdown};">{$serverStatus.countdown}</span>
				</span>
			{:else}
				Action Required - Reconnecting...
			{/if}
		</span>
	</div>
</button>
