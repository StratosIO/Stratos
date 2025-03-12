// lib/stores.ts
import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export const files = writable<
	Array<{
		id: string
		file: File
		thumb: string | null
		icon: string
		progress: number
		uploaded: boolean
		xhr?: XMLHttpRequest
	}>
>([])

export const tasks = writable<
	Array<{
		id: string
		status: string
		created_at: string
		updated_at?: string
		result_path?: string
		error?: string | null
	}>
>([])

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
export const endpoint = writable<string>(browser ? `${window.location.origin}/api` : '')
export const showConfigModal = writable<boolean>(false)
export const currentTab = writable<string>('files')

export const slashCommands: string[] = [
	'extract-audio',
	'convert-video',
	'create-thumbnail',
	'create-gif',
	'compress-video',
	'trim-video',
]
