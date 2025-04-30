<!-- lib/components/CommandInput.svelte -->
<script lang="ts">
	import {
		message,
		endpoint,
		files,
		tasks,
		token,
		taskSelected,
		currentTab,
		commands,
		showToast,
	} from '$lib/stores'
	import type { FileItem } from '$lib/types'
	import Suggestion from '$lib/components/Suggestion.svelte'

	let inputElement: HTMLDivElement

	let suggestionType = $state<'mention' | 'command' | null>(null)
	let query = $state('')
	let activeIndex = $state(0)

	let filteredItems = $derived.by((): (string | FileItem)[] => {
		if (!suggestionType) return []

		const q = query.toLowerCase()

		if (suggestionType === 'mention') {
			return $files.filter((file) => file.name.toLowerCase().includes(q)).slice(0, 5)
		}

		if (suggestionType === 'command') {
			return commands.filter((cmd) => cmd.toLowerCase().includes(q)).slice(0, 5)
		}

		return []
	})

	function onInput(): void {
		updateMessage()
		updateSuggestions()
	}

	function updateMessage(): void {
		if (!inputElement) return
		const txt = messageText(inputElement)
		message.set(txt)
		if (!inputElement.innerText.trim()) {
			inputElement.innerHTML = ''
		}
	}

	function updateSuggestions(): void {
		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) {
			suggestionType = null
			query = ''
			return
		}

		const range = sel.getRangeAt(0)
		const text = range.startContainer.textContent ?? ''
		const offset = range.startOffset

		if (text.startsWith('/')) {
			const candidate = text.slice(1, offset).trim()
			if (!/\s/.test(candidate)) {
				const exactMatch = commands.find((cmd) => cmd.toLowerCase() === candidate.toLowerCase())
				if (exactMatch) {
					insertCommandAtCursor(exactMatch)
					clearSuggestion()
					updateMessage()
					return
				}
				suggestionType = 'command'
				query = candidate
				activeIndex = 0
				return
			}
		}

		const atIndex = text.lastIndexOf('@', offset)
		if (atIndex !== -1) {
			const candidate = text.slice(atIndex + 1, offset)
			if (!/\s/.test(candidate)) {
				suggestionType = 'mention'
				query = candidate
				activeIndex = 0
				return
			}
		}

		clearSuggestion()
	}

	function clearSuggestion() {
		suggestionType = null
		query = ''
		activeIndex = 0
	}

	function onKeyDown(e: KeyboardEvent) {
		if (filteredItems.length === 0) return

		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault()
			activeIndex =
				(activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + filteredItems.length) %
				filteredItems.length
		} else if (e.key === 'Enter' || e.key === 'Tab') {
			e.preventDefault()
			const selected = filteredItems[activeIndex]
			if (selected) {
				insertSelectedItem(selected)
				clearSuggestion()
				updateMessage()
			}
		} else if (e.key === 'Escape') {
			clearSuggestion()
		}
	}

	function onBlur() {
		clearSuggestion()
		updateMessage()
	}

	function insertSelectedItem(item: string | FileItem) {
		if (suggestionType === 'command') {
			insertCommandAtCursor(item as string)
		} else {
			insertMentionAtCursor(item as FileItem)
		}
	}

	async function sendMessage() {
		const msg = $message.trim()
		const path = `${$endpoint}/tasks`

		const response = await fetch(path, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${$token}`,
			},
			body: JSON.stringify({ command: msg }),
		})

		if (!response.ok) {
			console.error('Message send failed:', msg)
			showToast('Message send failed, please check your settings.', 'error')
			currentTab.set('Settings')
			return
		}

		const data = await response.json()
		showToast('Message sent successfully!', 'success')
		inputElement.innerHTML = ''
		message.set('')

		if (data.success && data.task) {
			tasks.update((curr) => [...curr, data.task])
			taskSelected.set(data.task.id)
			currentTab.set('Tasks')
		}
	}

	export function messageText(input: HTMLDivElement): string {
		let text = ''
		for (const node of input.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) {
				text += node.textContent
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement
				text += el.dataset.mentionId || el.textContent
			}
		}
		return text
	}

	export function insertMentionAtCursor(file: FileItem): void {
		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) return

		const range = sel.getRangeAt(0)
		if (range.startContainer.nodeType !== Node.TEXT_NODE) return

		const textNode = range.startContainer
		const text = textNode.textContent ?? ''
		const atIndex = text.lastIndexOf('@', range.startOffset)
		if (atIndex === -1) return

		const before = text.slice(0, atIndex)
		const after = text.slice(range.startOffset)
		const mention = document.createElement('span')
		mention.style.userSelect = 'text'
		mention.style.backgroundColor = 'var(--color-secondary)'
		mention.style.color = 'var(--color-secondary-content)'
		mention.style.padding = '0 0.25em'
		mention.style.borderRadius = '0.25em'
		mention.contentEditable = 'false'
		mention.className = 'mention'
		mention.dataset.mentionId = file.id
		mention.textContent = `@${file.name.length > 30 ? `${file.name.slice(0, 27)}...` : file.name}`
		textNode.textContent = before

		const parent = textNode.parentNode
		if (parent) {
			parent.insertBefore(mention, textNode.nextSibling)
			parent.insertBefore(document.createTextNode(' '), mention.nextSibling)
			parent.insertBefore(document.createTextNode(after), mention.nextSibling?.nextSibling || null)
		}

		const newRange = document.createRange()
		newRange.setStartAfter(mention.nextSibling || mention)
		newRange.collapse(true)
		sel.removeAllRanges()
		sel.addRange(newRange)
	}

	export function insertCommandAtCursor(cmd: string): void {
		const sel = window.getSelection()
		if (!sel || sel.rangeCount === 0) return

		const range = sel.getRangeAt(0)
		if (range.startContainer.nodeType !== Node.TEXT_NODE) return

		const textNode = range.startContainer
		const text = textNode.textContent ?? ''
		const slashIndex = text.lastIndexOf('/', range.startOffset)
		if (slashIndex === -1) return

		const before = text.slice(0, slashIndex)
		const after = text.slice(range.startOffset)
		const command = document.createElement('span')
		command.contentEditable = 'false'
		command.className = 'font-bold'
		command.textContent = `/${cmd}`
		textNode.textContent = before

		const parent = textNode.parentNode
		if (parent) {
			parent.insertBefore(command, textNode.nextSibling)
			parent.insertBefore(document.createTextNode(' '), command.nextSibling)
			parent.insertBefore(document.createTextNode(after), command.nextSibling?.nextSibling || null)
		}

		const newRange = document.createRange()
		newRange.setStartAfter(command.nextSibling || command)
		newRange.collapse(true)
		sel.removeAllRanges()
		sel.addRange(newRange)
	}
</script>

<div class="form-control relative font-mono">
	<div
		contenteditable="plaintext-only"
		bind:this={inputElement}
		role="textbox"
		aria-multiline="true"
		tabindex="0"
		class="textarea bg-base-200 rounded-field w-full break-all transition-colors"
		oninput={onInput}
		onkeydown={onKeyDown}
		onblur={onBlur}
		data-placeholder="ffmpeg -i @input.mp4 -ss 00:00:01 -vframes 1 output.png"
	></div>
	<Suggestion
		show={!!suggestionType}
		items={filteredItems}
		{activeIndex}
		renderItem={(item: string | FileItem) =>
			suggestionType === 'command' ? `/${item as string}` : `@${(item as FileItem).name}`}
		onSelect={(item: string | FileItem) => {
			insertSelectedItem(item)
			clearSuggestion()
			updateMessage()
		}}
		onHover={(index: number) => (activeIndex = index)}
	/>

	<button
		type="button"
		onclick={sendMessage}
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
</style>
