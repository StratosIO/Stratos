// lib/stores.ts
import { writable } from 'svelte/store'
import { persist } from '$lib/utils/storage'

export type FileItem = {
	id: string
	name: string
	size: number
	type: string
	time: string
	icon: string
	progress: number
	thumb?: string
	xhr?: XMLHttpRequest
}

export type TaskItem = {
	id: string
	status: string
	created_at: string
	updated_at?: string
	result_path?: string
	error?: string | null
}

export const files = writable<FileItem[]>([])
export const tasks = writable<TaskItem[]>([])

export const serverStatus = writable<{
	online: boolean
	uptime: string
	countdown: number
	counting: boolean
}>({
	online: false,
	uptime: '',
	countdown: 10,
	counting: false,
})

export const fileSelected = writable<number>(-1)
export const taskSelected = writable<number>(-1)
export const command = writable<string>('')
export const endpoint = persist<string>('endpoint',	'/api');
export const showConfigModal = writable<boolean>(false)
export const currentTab = writable<string>('files')

export const slashCommands: string[] = [
	'extract-audio',
	'convert-video',
	'create-thumbnail',
	'create-gif',
	'compress-video',
	'trim-video',
	'ai-transcribe',
]
