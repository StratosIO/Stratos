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

		return suggestionType === 'mention'
			? $files.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 5)
			: commands.filter((cmd) => cmd.toLowerCase().includes(q)).slice(0, 5)
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
		if (!sel?.rangeCount) {
			clearSuggestion()
			return
		}

		const range = sel.getRangeAt(0)
		if (range.startContainer.nodeType !== Node.TEXT_NODE) {
			clearSuggestion()
			return
		}

		const text = range.startContainer.textContent ?? ''
		const offset = range.startOffset

		const trigger = findTrigger(text, offset)
		if (!trigger) {
			clearSuggestion()
			return
		}

		const { type, value } = trigger

		if (type === 'command') {
			const exact = commands.find((cmd) => cmd.toLowerCase() === value.toLowerCase())
			if (exact) {
				insertCommandAtCursor(exact)
				clearSuggestion()
				updateMessage()
				return
			}
		}

		suggestionType = type
		query = value
		activeIndex = 0
	}

	function findTrigger(
		text: string,
		offset: number,
	): { type: 'mention' | 'command'; value: string } | null {
		const slice = text.slice(0, offset)

		for (const [char, type] of [
			['@', 'mention'],
			['/', 'command'],
		] as const) {
			const index = slice.lastIndexOf(char)
			if (index !== -1) {
				const value = slice.slice(index + 1)
				if (!/\s/.test(value)) return { type, value }
			}
		}
		return null
	}

	function clearSuggestion() {
		suggestionType = null
		query = ''
		activeIndex = 0
	}

	function onKeyDown(e: KeyboardEvent) {
		if (!filteredItems.length) return

		const max = filteredItems.length
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault()
			activeIndex = (activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + max) % max
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
		const commands = $message
			.trim()
			.split('\n')
			.map((c) => c.trim())
			.filter(Boolean)
		if (!commands.length) return

		for (const cmd of commands) {
			const response = await fetch(`${$endpoint}/tasks`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$token}`,
				},
				body: JSON.stringify({ command: cmd }),
			})

			if (!response.ok) {
				showToast(`Failed to send: ${cmd}`, 'error')
				currentTab.set('Settings')
				break
			}

			const { success, task } = await response.json()
			if (success && task) {
				tasks.update((t) => [...t, { ...task, command: cmd }])
				taskSelected.set(task.id)
				currentTab.set('Tasks')
			}
			showToast(`Sent: <span class="font-mono">${cmd}</span>`, 'success')
			await new Promise((r) => setTimeout(r, 150))
		}

		inputElement.innerHTML = ''
		message.set('')
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

	function insertSpanAtTrigger(
		triggerChar: string,
		getSpan: (text: string) => HTMLSpanElement,
	): void {
		const sel = window.getSelection()
		if (!sel?.rangeCount) return

		const range = sel.getRangeAt(0)
		if (range.startContainer.nodeType !== Node.TEXT_NODE) return

		const textNode = range.startContainer
		const text = textNode.textContent ?? ''
		const triggerIndex = text.lastIndexOf(triggerChar, range.startOffset)
		if (triggerIndex === -1) return

		const before = text.slice(0, triggerIndex)
		const after = text.slice(range.startOffset)
		const span = getSpan(text.slice(triggerIndex + 1, range.startOffset))

		textNode.textContent = before

		const parent = textNode.parentNode
		if (parent) {
			parent.insertBefore(span, textNode.nextSibling)
			parent.insertBefore(document.createTextNode(' '), span.nextSibling)
			parent.insertBefore(document.createTextNode(after), span.nextSibling?.nextSibling || null)
		}

		const newRange = document.createRange()
		newRange.setStartAfter(span.nextSibling || span)
		newRange.collapse(true)
		sel.removeAllRanges()
		sel.addRange(newRange)
	}

	export function insertMentionAtCursor(file: FileItem): void {
		insertSpanAtTrigger('@', () => {
			const mention = document.createElement('span')
			mention.contentEditable = 'false'
			mention.className = 'select-text text-secondary-content bg-secondary rounded-sm px-1'
			mention.dataset.mentionId = file.id
			mention.textContent = `@${file.name.length > 30 ? `${file.name.slice(0, 27)}...` : file.name}`
			return mention
		})
	}

	export function insertCommandAtCursor(cmd: string): void {
		insertSpanAtTrigger('/', () => {
			const command = document.createElement('span')
			command.contentEditable = 'false'
			command.className = 'font-bold'
			command.textContent = `/${cmd}`
			return command
		})
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
