// lib/stores.ts
import { writable } from 'svelte/store'
import { persist } from '$lib/utils/storage'
import type { UserInfo, FileItem, TaskItem } from '$lib/types'

export const files = writable<FileItem[]>([])
export const tasks = writable<TaskItem[]>([])

export const uptime = writable<number>(0)
export const online = writable(false)

export const counter = writable<{
	countdown: number
	counting: boolean
}>({
	countdown: 10,
	counting: false,
})

let tid = 0

export const toast = writable<{
	id: number
	message: string
	type: 'info' | 'success' | 'error'
	duration: number
} | null>(null)

export function showToast(
	message: string,
	type: 'info' | 'success' | 'error' = 'info',
	duration = 3000,
) {
	toast.set({ id: ++tid, message, type, duration })
}

export const fileSelected = writable<string | null>(null)
export const taskSelected = writable<string | null>(null)

export const message = writable<string>('')
export const currentTab = writable<string>('Files')
export const userInfo = writable<UserInfo | null>(null)

export const token = persist<string>('token', '')
export const endpoint = persist<string>('endpoint', '/api')
export const maxBlobSize = persist<number>('maxBlobSize', 10000000)

export const commands: string[] = [
	'extract-audio',
	'convert-video',
	'create-thumbnail',
	'create-gif',
	'compress-video',
	'trim-video',
	'ai-transcribe',
	'ai-slowmotion',
	'ai-fpsboost',
	'ai-subtitle',
]
