// $lib/utils/requests.ts
import { get } from 'svelte/store'
import { token, endpoint, online, uptime, counter, userInfo, files, tasks } from '$lib/stores'
import type { UserInfo, FileItem, DeleteOptions, FetchOptions } from '$lib/types'

let eventSource: EventSource | null = null
let countdownInterval: number | undefined

export async function fetchUserInfo(endpoint: string, token: string): Promise<UserInfo | null> {
	const url = `${endpoint}/auth/me`

	try {
		const response = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
		})

		// Return null for non-OK responses
		if (!response.ok) {
			console.error('Failed to fetch user information:', response.status)
			return null
		}

		// Parse the response directly as UserInfo
		const userInfo = await response.json()
		return userInfo as UserInfo
	} catch (error) {
		console.error('Error fetching user information:', error)
		return null
	}
}

export async function fetchUserData(): Promise<boolean> {
	const currentEndpoint = get(endpoint)
	const currentToken = get(token)

	try {
		const info = await fetchUserInfo(currentEndpoint, currentToken)

		if (!info) {
			// Authentication failed
			return false
		}

		userInfo.set(info)

		// Fetch files after successful auth
		await fetchAllRemoteItems<FileItem, FileItem>({
			endpoint: currentEndpoint,
			resource: 'uploads',
			token: currentToken,
			store: files,
			transform: (raw) => ({
				...raw,
				icon: 'cloud_sync',
				progress: 100,
			}),
		})

		// Fetch tasks
		await fetchAllRemoteItems({
			endpoint: currentEndpoint,
			resource: 'tasks',
			token: currentToken,
			store: tasks,
			transform: (r) => r,
		})

		return true
	} catch (error) {
		console.error('Error synchronizing user data:', error)
		return false
	}
}

export const resetConnection = () => {
	eventSource?.close()
	eventSource = null

	if (countdownInterval !== undefined) {
		clearInterval(countdownInterval)
		countdownInterval = undefined
	}

	online.set(false)
	counter.set({ counting: false, countdown: 0 })
}

const startCountdown = () => {
	if (countdownInterval !== undefined) return

	let cnt = 10
	counter.set({ counting: true, countdown: cnt })

	const interval = setInterval(() => {
		if (get(online) || cnt <= 0) {
			clearInterval(interval)
			countdownInterval = undefined
			counter.update((c) => ({ ...c, counting: false }))
			if (!get(online)) statusEventSource()
		} else {
			counter.update((c) => ({ ...c, countdown: --cnt }))
		}
	}, 1000)

	countdownInterval = interval
}

export const statusEventSource = () => {
	resetConnection()
	eventSource = new EventSource(`${get(endpoint)}/status`)

	eventSource.onopen = () => {
		online.set(true)
		counter.set({ counting: false, countdown: 10 })
	}

	eventSource.onerror = () => {
		online.set(false)
		setTimeout(() => {
			if (!get(counter).counting && countdownInterval === undefined) {
				startCountdown()
			}
		}, 800)
	}

	eventSource.onmessage = (event) => {
		uptime.set(event.data)
	}
}

export const initializeStatusMonitor = () => {
	const unsubscribe = endpoint.subscribe(statusEventSource)

	return () => {
		unsubscribe()
		resetConnection()
	}
}

export async function deleteRemoteItem({
	id,
	endpoint,
	resource,
	token,
}: DeleteOptions): Promise<boolean> {
	const path = `${endpoint}/${resource}/${id}`

	try {
		const response = await fetch(path, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` },
		})

		const result = await response.json()

		if (!response.ok) {
			console.error('Remote deletion failed:', result)
			return false
		}

		console.log(`${resource} deleted successfully:`, result)
		return true
	} catch (error) {
		console.error(`Error deleting ${resource}:`, error)
		return false
	}
}

export async function fetchRemoteItems<T, R>({
	endpoint,
	resource,
	store,
	transform,
	token,
	limit = 50,
	cursor,
	append = false,
}: FetchOptions<T, R>): Promise<{ nextCursor: string | null; hasMore: boolean }> {
	const params = new URLSearchParams({ limit: String(limit) })
	if (cursor) params.set('cursor', cursor)

	const url = `${endpoint}/${resource}?${params}`

	try {
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${token}` },
		})

		const json = await res.json()

		if (!res.ok || !json.success) {
			console.error(`Failed to fetch ${resource}:`, json)
			return { nextCursor: null, hasMore: false }
		}

		const items = (json.data as R[]).map(transform)
		store.update((current) => (append ? [...current, ...items] : items))

		return {
			nextCursor: json.pagination?.next_cursor ?? null,
			hasMore: Boolean(json.pagination?.has_more),
		}
	} catch (error) {
		console.error(`Error fetching ${resource}:`, error)
		return { nextCursor: null, hasMore: false }
	}
}

export async function fetchAllRemoteItems<T, R>({
	endpoint,
	resource,
	store,
	transform,
	token,
	limit = 10,
}: Omit<FetchOptions<T, R>, 'cursor' | 'append'>): Promise<void> {
	let cursor: string | undefined
	let hasMore = true

	store.set([])

	while (hasMore) {
		const result = await fetchRemoteItems<T, R>({
			endpoint,
			resource,
			store,
			transform,
			token,
			limit,
			cursor,
			append: true,
		})

		cursor = result.nextCursor ?? undefined
		hasMore = result.hasMore
	}
}

export async function downloadTaskResult(taskId: string) {
	try {
		const response = await fetch(`${get(endpoint)}/tasks/${taskId}`, {
			headers: {
				Authorization: `Bearer ${get(token)}`,
			},
		})

		if (!response.ok) throw new Error('Download failed')

		const blob = await response.blob()
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${taskId}`
		a.click()
		URL.revokeObjectURL(url)
	} catch (error) {
		console.error('Failed to download task result:', error)
	}
}
