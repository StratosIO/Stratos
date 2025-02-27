<!-- lib/components/CommandInput.svelte -->
<script lang="ts">
  import { command, files, endpoint, showConfigModal } from '$lib/stores'
  import { get } from 'svelte/store'

  type FileItem = { id: string; file: File; thumb: string | null; icon: string }

  let inputEl: HTMLDivElement
  let showSuggestions = false
  let suggestionQuery = ''
  let activeSuggestionIndex = 0

  $: filteredFiles = showSuggestions
    ? $files
        .filter((f: FileItem) => f.file.name.toLowerCase().includes(suggestionQuery.toLowerCase()))
        .slice(0, 3)
    : []

  function updateCommand(): void {
    let result = ''
    inputEl.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent
      } else {
        const el = node as HTMLElement
        result += el.dataset.mentionId || el.textContent
      }
    })
    command.set(result)
    if (!inputEl.innerText.trim()) {
      inputEl.innerHTML = ''
    }
  }

  function updateSuggestions(): void {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      showSuggestions = false
      suggestionQuery = ''
      return
    }
    const range = sel.getRangeAt(0)
    if (range.startContainer.parentElement?.classList.contains('mention')) {
      showSuggestions = false
      suggestionQuery = ''
      return
    }
    const text = range.startContainer.textContent || ''
    const offset = range.startOffset
    const atIndex = text.lastIndexOf('@', offset)
    if (atIndex !== -1) {
      const candidate = text.slice(atIndex + 1, offset)
      if (!/\s/.test(candidate)) {
        suggestionQuery = candidate
        showSuggestions = true
        activeSuggestionIndex = 0
        return
      }
    }
    showSuggestions = false
    suggestionQuery = ''
  }

  function insertMention(file: FileItem): void {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.startContainer.nodeType !== Node.TEXT_NODE) return

    const textNode = range.startContainer
    const text = textNode.textContent || ''
    const atIndex = text.lastIndexOf('@', range.startOffset)
    if (atIndex === -1) return

    const beforeText = text.substring(0, atIndex)
    const afterText = text.substring(range.startOffset)

    const mention = document.createElement('span')
    mention.contentEditable = 'false'
    mention.className =
      'select-text text-primary bg-primary/20 rounded-sm px-1 hover:bg-primary hover:text-light transition-colors'
    mention.dataset.mentionId = file.id

    let displayName = file.file.name
    if (displayName.length > 30) {
      displayName = displayName.slice(0, 27) + '...'
    }
    mention.textContent = `@${displayName}`

    textNode.textContent = beforeText
    const parent = textNode.parentNode
    if (parent) {
      parent.insertBefore(mention, textNode.nextSibling)
      const spaceNode = document.createTextNode(' ')
      parent.insertBefore(spaceNode, mention.nextSibling)
      const afterTextNode = document.createTextNode(afterText)
      parent.insertBefore(afterTextNode, spaceNode.nextSibling)
    }

    const newRange = document.createRange()
    const nextNode = mention.nextSibling ? mention.nextSibling : mention
    newRange.setStartAfter(nextNode)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)

    updateCommand()
    showSuggestions = false
    inputEl.focus()
  }

  function onInput(): void {
    updateCommand()
    updateSuggestions()
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (!showSuggestions || filteredFiles.length === 0) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      activeSuggestionIndex =
        (activeSuggestionIndex + (e.key === 'ArrowDown' ? 1 : -1) + filteredFiles.length) %
        filteredFiles.length
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertMention(filteredFiles[activeSuggestionIndex])
    } else if (e.key === 'Escape') {
      showSuggestions = false
    }
  }

  function onBlur(): void {
    setTimeout(() => {
      showSuggestions = false
      updateCommand()
    }, 150)
  }

  async function sendCommand() {
    const path = `${get(endpoint)}/tasks`
    const message = get(command).trim()
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: message }),
    })

    if (!response.ok) {
      console.error('Command send failed:', message)
      showConfigModal.set(true)
    } else {
      console.log('Command Sent:', message)
      inputEl.innerHTML = ''
      command.set('')
    }
  }
</script>

<div class="relative">
  <div
    contenteditable="plaintext-only"
    bind:this={inputEl}
    role="textbox"
    aria-multiline="true"
    tabindex="0"
    class="bg-pale w-full rounded-lg px-4 py-2 break-all"
    on:input={onInput}
    on:keydown={onKeyDown}
    on:blur={onBlur}
    data-placeholder="e.g., ffmpeg -i @input.mp4 -ss 00:00:01 -vframes 1 output.png"
  ></div>

  {#if showSuggestions}
    <ul
      role="listbox"
      class="border-mild bg-light absolute right-0 left-0 z-10 mt-2 max-h-48 overflow-y-auto rounded-lg border shadow-lg"
    >
      {#each filteredFiles as file, index (file.id)}
        <li
          role="option"
          tabindex="0"
          aria-selected={index === activeSuggestionIndex}
          class="cursor-pointer truncate px-4 py-2 {index === activeSuggestionIndex
            ? 'bg-primary/10'
            : ''}"
          on:click={() => insertMention(file)}
          on:focus={() => (activeSuggestionIndex = index)}
          on:keydown={(e) => e.key === 'Enter' && insertMention(file)}
        >
          @{file.file.name}
        </li>
      {:else}
        <li class="px-4 py-2 text-dark/70">No suggestions</li>
      {/each}
    </ul>
  {/if}

  <button
    type="button"
    on:click={sendCommand}
    aria-label="Send"
    class="absolute right-2 bottom-2 flex"
  >
    <i class="material-icons text-dark/50 hover:text-dark text-lg transition-colors">send</i>
  </button>
</div>

<style>
  [contenteditable]:empty:before {
    content: attr(data-placeholder);
    color: var(--custom-dark);
    opacity: 0.5;
  }
</style>
