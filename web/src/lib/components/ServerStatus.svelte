<!-- lib/components/ServerStatus.svelte -->
<script lang="ts">
	import { endpoint, serverStatus, showConfigModal } from '$lib/stores'
	import { onDestroy, onMount } from 'svelte'
	import { get } from 'svelte/store'

	let eventSource: EventSource | null = null
	let endpointUnsubscribe: () => void
	let countdownAbortController: AbortController | null = null
	let countdownInProgress = false

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
		countdownAbortController?.abort()
		updateServerStatus({ online: false, counting: false, countdown: 0 })
	}

	const setupEventSource = () => {
		resetConnection()
		eventSource = new EventSource(`${get(endpoint)}/status`)
		eventSource.onopen = () => updateServerStatus({ online: true, countdown: 10, counting: false })
		eventSource.onerror = () => {
			updateServerStatus({ online: false })
			setTimeout(() => {
				if (!get(serverStatus).counting && !countdownInProgress) {
					startCountdown()
				}
			}, 500)
		}
		eventSource.onmessage = (event) => {
			updateServerStatus({
				uptime: Math.floor(Number.parseFloat(event.data)).toString(),
			})
		}
	}

	const delay = (ms: number, signal?: AbortSignal) =>
		new Promise<void>((resolve, reject) => {
			const timer = setTimeout(resolve, ms)
			signal?.addEventListener(
				'abort',
				() => {
					clearTimeout(timer)
					reject(new Error('aborted'))
				},
				{ once: true },
			)
		})

	const startCountdown = async () => {
		if (countdownInProgress) return
		countdownInProgress = true
		countdownAbortController?.abort()
		countdownAbortController = new AbortController()
		const { signal } = countdownAbortController

		updateServerStatus({ counting: true, countdown: 10 })
		let count = 10

		try {
			while (!get(serverStatus).online && count > 0) {
				await delay(1000, signal)
				updateServerStatus({ countdown: --count })
			}
		} catch {
			return
		} finally {
			updateServerStatus({ counting: false })
			countdownInProgress = false
		}
		if (!get(serverStatus).online) setupEventSource()
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
		<span class="text-base-content mt-[2.5px] truncate">
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
