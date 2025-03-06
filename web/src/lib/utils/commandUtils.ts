// lib/utils/commandUtils.ts
export function getCommandText(inputElement: HTMLDivElement): string {
	let text = ''
	for (const node of inputElement.childNodes) {
		if (node.nodeType === Node.TEXT_NODE) {
			text += node.textContent
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement
			text += el.dataset.mentionId || el.textContent
		}
	}
	return text
}

export function insertMentionAtCursor(file: { id: string; file: File }): void {
	const sel = window.getSelection()
	if (!sel || sel.rangeCount === 0) return
	const range = sel.getRangeAt(0)
	if (range.startContainer.nodeType !== Node.TEXT_NODE) return
	const textNode = range.startContainer
	const text = textNode.textContent || ''
	const atIndex = text.lastIndexOf('@', range.startOffset)
	if (atIndex === -1) return
	const before = text.slice(0, atIndex)
	const after = text.slice(range.startOffset)
	const mention = document.createElement('span')
	mention.contentEditable = 'false'
	mention.className =
		'select-text text-primary-content bg-primary/20 rounded-sm px-1 hover:bg-accent hover:text-accent-content transition-colors'
	mention.dataset.mentionId = file.id
	let name = file.file.name
	if (name.length > 30) name = `${name.slice(0, 27)}...`
	mention.textContent = `@${name}`
	textNode.textContent = before
	const parent = textNode.parentNode
	if (parent) {
		parent.insertBefore(mention, textNode.nextSibling)
		const space = document.createTextNode(' ')
		parent.insertBefore(space, mention.nextSibling)
		const afterNode = document.createTextNode(after)
		parent.insertBefore(afterNode, space.nextSibling)
	}
	const newRange = document.createRange()
	newRange.setStartAfter(mention.nextSibling || mention)
	newRange.collapse(true)
	sel.removeAllRanges()
	sel.addRange(newRange)
}

export function insertSlashCommandAtCursor(cmd: string): void {
	const sel = window.getSelection()
	if (!sel || sel.rangeCount === 0) return
	const range = sel.getRangeAt(0)
	if (range.startContainer.nodeType !== Node.TEXT_NODE) return
	const textNode = range.startContainer
	const text = textNode.textContent || ''
	const atIndex = text.lastIndexOf('/', range.startOffset)
	if (atIndex === -1) return
	const before = text.slice(0, atIndex)
	const after = text.slice(range.startOffset)
	const command = document.createElement('span')
	command.contentEditable = 'false' // 设置为不可编辑，使其成为原子节点
	command.className = 'font-bold'
	command.textContent = `/${cmd}`
	textNode.textContent = before
	const parent = textNode.parentNode
	if (parent) {
		parent.insertBefore(command, textNode.nextSibling)
		const space = document.createTextNode(' ')
		parent.insertBefore(space, command.nextSibling)
		const afterNode = document.createTextNode(after)
		parent.insertBefore(afterNode, space.nextSibling)
	}
	const newRange = document.createRange()
	newRange.setStartAfter(command.nextSibling || command)
	newRange.collapse(true)
	sel.removeAllRanges()
	sel.addRange(newRange)
}
