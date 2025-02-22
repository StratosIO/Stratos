<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { serverStatus, apiEndpoint, showConfigModal } from '$lib/stores'
  import { get } from 'svelte/store'

  let eventSource: EventSource | null = null
  let apiEndpointUnsubscribe: () => void
  let countdownAbortController: AbortController | null = null
  let countdownInProgress = false

  const updateServerStatus = (
    updates: Partial<{ online: boolean; counting: boolean; countdown: number; uptime: string }>,
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
    eventSource = new EventSource(`${get(apiEndpoint)}/status`)
    eventSource.onopen = () => updateServerStatus({ online: true, countdown: 10, counting: false })
    eventSource.onerror = () => {
      updateServerStatus({ online: false })
      if (!get(serverStatus).counting && !countdownInProgress) startCountdown()
    }
    eventSource.onmessage = (event) => {
      updateServerStatus({ uptime: Math.floor(parseFloat(event.data)).toString() })
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
    apiEndpointUnsubscribe = apiEndpoint.subscribe(setupEventSource)
  })

  onDestroy(() => {
    resetConnection()
    apiEndpointUnsubscribe?.()
  })

  const openModal = () => showConfigModal.set(true)
</script>

<button
  type="button"
  on:click={openModal}
  class="bg-pale mb-6 flex w-full items-center rounded-lg p-6"
>
  <span class="mr-3 h-2.5 w-2.5 rounded-full {$serverStatus.online ? 'bg-success' : 'bg-warning'}"
  ></span>
  <span class="text-dark mt-[2.5px] truncate">
    {#if $serverStatus.online}
      Server Online - Uptime: {$serverStatus.uptime}
    {:else if $serverStatus.counting}
      Action Required - Reconnect in {$serverStatus.countdown}
    {:else}
      Action Required - Reconnecting...
    {/if}
  </span>
</button>
