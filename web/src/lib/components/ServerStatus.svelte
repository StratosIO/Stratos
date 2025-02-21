<!-- lib/components/ServerStatus.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { serverStatus, apiEndpoint, showConfigModal } from '$lib/stores'
  import { get } from 'svelte/store'

  let eventSource: EventSource | null = null
  let apiEndpointUnsubscribe: () => void
  let countdownAbortController: AbortController | null = null

  function updateServerStatus(
    updates: Partial<{
      online: boolean
      counting: boolean
      countdown: number
      uptime: string
    }>,
  ) {
    serverStatus.update((status) => ({ ...status, ...updates }))
  }

  function resetConnection() {
    eventSource?.close()
    countdownAbortController?.abort()
    updateServerStatus({ online: false, counting: false, countdown: 0 })
  }

  function setupEventSource() {
    resetConnection()
    eventSource = new EventSource(`${get(apiEndpoint)}/status`)

    eventSource.onopen = () => updateServerStatus({ online: true, countdown: 10, counting: false })

    eventSource.onerror = () => {
      updateServerStatus({ online: false })
      startCountdown()
    }

    eventSource.onmessage = (event) => {
      updateServerStatus({ uptime: Math.floor(parseFloat(event.data)).toString() })
    }
  }

  async function startCountdown() {
    countdownAbortController?.abort()
    countdownAbortController = new AbortController()
    const { signal } = countdownAbortController

    updateServerStatus({ counting: true, countdown: 10 })
    let count = 10

    while (!get(serverStatus).online && count > 0) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 1000)
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer)
            reject(new Error('aborted'))
          },
          { once: true },
        )
      })

      if (signal.aborted) return
      updateServerStatus({ countdown: --count })
    }

    updateServerStatus({ counting: false })
    if (!get(serverStatus).online) setupEventSource()
  }

  onMount(() => {
    setupEventSource()
    apiEndpointUnsubscribe = apiEndpoint.subscribe(() => setupEventSource())
  })

  onDestroy(() => {
    resetConnection()
    apiEndpointUnsubscribe?.()
  })

  function openModal() {
    showConfigModal.set(true)
  }
</script>

<button
  type="button"
  on:click={openModal}
  class="mb-6 flex w-full items-center rounded-lg bg-gray-100 p-6"
>
  <span class="mr-3 h-2.5 w-2.5 rounded-full {$serverStatus.online ? 'bg-success' : 'bg-warning'}"
  ></span>
  <span class="mt-[2.5px] truncate text-dark">
    {#if $serverStatus.online}
      Server Online - Uptime: {$serverStatus.uptime}
    {:else if $serverStatus.counting}
      Action Required - Reconnect in {$serverStatus.countdown}
    {:else}
      Action Required - Reconnecting...
    {/if}
  </span>
</button>
