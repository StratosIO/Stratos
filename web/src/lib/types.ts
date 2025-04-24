import type { Writable } from 'svelte/store'

export type UserInfo = {
	id: string
	username: string
	email: string
	role: string
}

export type FileItem = {
	id: string
	name: string
	size: number
	type: string
	time: string
	icon?: string
	progress?: number
	xhr?: XMLHttpRequest
}

export type TaskItem = {
	id: string
	status: string
	created_at: string
	updated_at?: string
	result_path?: string
	error?: string | null
	progress?: number
}

export type DeleteOptions = {
	id: string | number
	endpoint: string
	resource: string
	token: string
}

export type FetchOptions<T, R> = {
	endpoint: string
	resource: string
	store: Writable<T[]>
	transform: (raw: R) => T
	token: string
	limit?: number
	cursor?: string
	append?: boolean
}
