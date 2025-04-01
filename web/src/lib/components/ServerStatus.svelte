<!-- lib/components/ServerStatus.svelte -->
<script lang="ts">
	import { endpoint, online, uptime, counter, showConfigModal } from '$lib/stores'
	import { get } from 'svelte/store'

	let eventSource: EventSource | null = null
	let countdownInterval: number | undefined

	const resetConnection = () => {
		eventSource?.close()
		eventSource = null

		if (countdownInterval !== undefined) {
			clearInterval(countdownInterval)
			countdownInterval = undefined
		}

		online.set(false)
		counter.set({ counting: false, countdown: 0 })
	}

	const setupEventSource = () => {
		resetConnection()
		eventSource = new EventSource(`${get(endpoint)}/status`)

		eventSource.onopen = () => {
			online.set(true)
			counter.set({ counting: false, countdown: 10 })
		}

		eventSource.onerror = () => {
			online.set(false)
			setTimeout(() => {
				if (!get(counter).counting && countdownInterval === undefined) {
					startCountdown()
				}
			}, 800)
		}

		eventSource.onmessage = (event) => {
			const seconds = Math.floor(Number.parseFloat(event.data)).toString()
			uptime.set(seconds)
		}

		/*
		eventSource.onmessage = (event) => {
			const seconds = Math.floor(parseFloat(event.data))
			const formatted = new Date(seconds * 1000).toISOString().substring(11, 19)
			uptime.set(formatted)
		}
		*/
	}

	// 10 seconds countdown
	const startCountdown = () => {
		if (countdownInterval !== undefined) return

		let cnt = 10
		counter.set({ counting: true, countdown: cnt })

		const interval = setInterval(() => {
			if (get(online) || cnt <= 0) {
				clearInterval(interval)
				countdownInterval = undefined
				counter.update((c) => ({ ...c, counting: false }))
				if (!get(online)) setupEventSource()
			} else {
				counter.update((c) => ({ ...c, countdown: --cnt }))
			}
		}, 1000)

		countdownInterval = interval
	}

	$effect(() => {
		const unsubscribe = endpoint.subscribe(setupEventSource)
		return () => {
			unsubscribe()
			resetConnection()
		}
	})

	const openModal = () => showConfigModal.set(true)
</script>

<button
	type="button"
	onclick={openModal}
	class="bg-base-200 rounded-field flex w-full items-center p-6"
>
	<div class="flex items-center">
		{#if $online}
			<div class="status status-success mr-3 animate-bounce"></div>
		{:else if $counter.counting}
			<div class="mr-3 inline-grid *:[grid-area:1/1]">
				<div class="status status-error animate-ping"></div>
				<div class="status status-error"></div>
			</div>
		{:else}
			<span class="status status-warning mr-3"></span>
		{/if}

		<span class="text-base-content mt-1 truncate">
			{#if $online}
				Server Online - Uptime: {$uptime}
			{:else if $counter.counting}
				Action Required - Reconnect in
				<span class="countdown">
					<span style="--value:{$counter.countdown};">
						{$counter.countdown}
					</span>
				</span>
			{:else}
				Action Required - Reconnecting...
			{/if}
		</span>
	</div>
</button>
