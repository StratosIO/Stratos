// lib/stores.ts
import { writable } from 'svelte/store'
import { persist } from '$lib/utils/storage'
import type { FileItem, TaskItem } from '$lib/types'

export const files = writable<FileItem[]>([])
export const tasks = writable<TaskItem[]>([])

export const uptime = writable('')
export const online = writable(false)

export const counter = writable<{
	countdown: number
	counting: boolean
}>({
	countdown: 10,
	counting: false,
})

export const fileSelected = writable<number>(-1)
export const taskSelected = writable<number>(-1)
export const command = writable<string>('')
export const showConfigModal = writable<boolean>(false)
export const currentTab = writable<string>('files')

export const token = persist<string>('token', '')
export const endpoint = persist<string>('endpoint', '/api')

export const slashCommands: string[] = [
	'extract-audio',
	'convert-video',
	'create-thumbnail',
	'create-gif',
	'compress-video',
	'trim-video',
	'ai-transcribe',
]
