<!-- lib/components/CommandInput.svelte -->
<script lang="ts">
	import {
		command,
		endpoint,
		files,
		tasks,
		taskSelected,
		showConfigModal,
		currentTab,
		slashCommands,
	} from '$lib/stores'
	import { get } from 'svelte/store'
	import {
		getCommandText,
		insertMentionAtCursor,
		insertSlashCommandAtCursor,
	} from '$lib/utils/input'

	let inputElement: HTMLDivElement
	let showSuggestions = $state(false)
	let suggestionQuery = $state('')
	let activeSuggestionIndex = $state(0)
	let showSlashSuggestions = $state(false)
	let slashQuery = $state('')
	let activeSlashIndex = $state(0)

	let filteredFiles = $derived(
		showSuggestions
			? $files
					.filter((file) => file.name.toLowerCase().includes(suggestionQuery.toLowerCase()))
					.slice(0, 5)
			: [],
	)
	let filteredSlash = $derived(
		showSlashSuggestions
			? slashCommands
					.filter((cmd) => cmd.toLowerCase().includes(slashQuery.toLowerCase()))
					.slice(0, 5)
			: [],
	)

	function updateCommand(): void {
		if (!inputElement) return
		const txt = getCommandText(inputElement)
		command.set(txt)
		if (!inputElement.innerText.trim()) {
			inputElement.innerHTML = ''
		}
	}

	function updateSuggestions(): void {
		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) {
			resetAllSuggestions()
			return
		}

		const range = sel.getRangeAt(0)
		const text = range.startContainer.textContent || ''
		const offset = range.startOffset

		if (text.startsWith('/')) {
			const candidate = text.slice(1, offset).trim()
			if (!/\s/.test(candidate)) {
				const exactMatch = slashCommands.find(
					(cmd) => cmd.toLowerCase() === candidate.toLowerCase(),
				)
				if (exactMatch) {
					insertSlashCommandAtCursor(exactMatch)
					resetSlashSuggestions()
					return
				}
				setSlashSuggestions(candidate)
				return
			}
			resetSlashSuggestions()
			return
		}

		const atIndex = text.lastIndexOf('@', offset)
		if (atIndex !== -1) {
			const candidate = text.slice(atIndex + 1, offset)
			if (!/\s/.test(candidate)) {
				setMentionSuggestions(candidate)
				return
			}
		}

		resetAllSuggestions()
	}

	function resetAllSuggestions(): void {
		showSuggestions = false
		suggestionQuery = ''
		resetSlashSuggestions()
	}

	function resetSlashSuggestions(): void {
		showSlashSuggestions = false
		slashQuery = ''
	}

	function setSlashSuggestions(query: string): void {
		slashQuery = query
		showSlashSuggestions = true
		activeSlashIndex = 0
		showSuggestions = false
		suggestionQuery = ''
	}

	function setMentionSuggestions(query: string): void {
		suggestionQuery = query
		showSuggestions = true
		activeSuggestionIndex = 0
		resetSlashSuggestions()
	}

	function onInput(): void {
		updateCommand()
		updateSuggestions()
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (showSlashSuggestions && filteredSlash.length > 0) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault()
				activeSlashIndex =
					(activeSlashIndex + (e.key === 'ArrowDown' ? 1 : -1) + filteredSlash.length) %
					filteredSlash.length
			} else if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault()
				insertSlashCommandAtCursor(filteredSlash[activeSlashIndex])
				updateCommand()
			} else if (e.key === 'Escape') {
				showSlashSuggestions = false
			}
			return
		}
		if (showSuggestions && filteredFiles.length > 0) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
				e.preventDefault()
				activeSuggestionIndex =
					(activeSuggestionIndex + (e.key === 'ArrowDown' ? 1 : -1) + filteredFiles.length) %
					filteredFiles.length
			} else if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault()
				insertMentionAtCursor(filteredFiles[activeSuggestionIndex])
				updateCommand()
			} else if (e.key === 'Escape') {
				showSuggestions = false
			}
		}
	}

	function onBlur(): void {
		setTimeout(() => {
			showSuggestions = false
			showSlashSuggestions = false
			updateCommand()
		}, 150)
	}

	async function sendCommand() {
		const path = `${get(endpoint)}/tasks`
		const msg = get(command).trim()
		const response = await fetch(path, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ command: msg }),
		})
		if (!response.ok) {
			console.error('Command send failed:', msg)
			showConfigModal.set(true)
		} else {
			const data = await response.json()
			console.log('Command Sent:', msg)
			inputElement.innerHTML = ''
			command.set('')
			if (data.success && data.task) {
				tasks.update((curr) => [...curr, data.task])
				taskSelected.set(get(tasks).length - 1)
				currentTab.set('tasks')
			}
		}
	}
</script>

<div class="form-control relative">
	<div
		contenteditable="plaintext-only"
		bind:this={inputElement}
		role="textbox"
		aria-multiline="true"
		tabindex="0"
		class="textarea bg-base-200 rounded-field w-full break-all transition-colors focus:outline-none"
		oninput={onInput}
		onkeydown={onKeyDown}
		onblur={onBlur}
		data-placeholder="e.g., ffmpeg -i @input.mp4 -ss 00:00:01 -vframes 1 output.png"
	></div>
	{#if showSlashSuggestions}
		<ul
			role="listbox"
			class="menu bg-base-100 rounded-field absolute right-0 left-0 mt-2 max-h-48 w-full overflow-y-auto shadow"
		>
			{#each filteredSlash as cmd, index}
				<li
					role="option"
					tabindex="0"
					aria-selected={index === activeSlashIndex}
					class={index === activeSlashIndex ? 'bg-base-content/10 rounded-selector' : ''}
					onclick={() => {
						insertSlashCommandAtCursor(cmd)
						updateCommand()
					}}
					onfocus={() => (activeSlashIndex = index)}
					onkeydown={(e) => e.key === 'Enter' && insertSlashCommandAtCursor(cmd)}
					onmouseover={() => (activeSlashIndex = index)}
				>
					<button class="rounded-selector w-full text-left">/{cmd}</button>
				</li>
			{:else}
				<li class="px-4 py-2 text-base-content/70">No suggestions</li>
			{/each}
		</ul>
	{:else if showSuggestions}
		<ul
			role="listbox"
			class="menu bg-base-100 rounded-field absolute right-0 left-0 mt-2 max-h-48 w-full overflow-y-auto shadow"
		>
			{#each filteredFiles as file, index (file.id)}
				<li
					role="option"
					tabindex="0"
					aria-selected={index === activeSuggestionIndex}
					class={index === activeSuggestionIndex ? 'bg-base-content/10 rounded-selector' : ''}
					onclick={() => {
						insertMentionAtCursor(file)
						updateCommand()
					}}
					onfocus={() => (activeSuggestionIndex = index)}
					onkeydown={(e) => e.key === 'Enter' && insertMentionAtCursor(file)}
					onmouseover={() => (activeSuggestionIndex = index)}
				>
					<button class="rounded-selector w-full text-left">@{file.name}</button>
				</li>
			{:else}
				<li class="px-4 py-2 text-base-content/70">No suggestions</li>
			{/each}
		</ul>
	{/if}
	<button
		type="button"
		onclick={sendCommand}
		aria-label="Send"
		class="btn btn-square btn-sm rounded-selector btn-ghost absolute right-3 bottom-3"
	>
		<i class="material-icons-round text-base-content/50">send</i>
	</button>
</div>

<style>
	[contenteditable]:empty:before {
		content: attr(data-placeholder);
		color: var(--color-base);
		opacity: 0.5;
	}
	.menu li:hover {
		background: none !important;
	}
</style>
