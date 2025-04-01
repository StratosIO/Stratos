// $lib/utils/items.ts
import type { Writable } from 'svelte/store'

type DeleteOptions = {
	id: string | number
	endpoint: string
	resource: string
	token?: string
}

type FetchOptions<T, R> = {
	endpoint: string
	resource: string
	store: Writable<T[]>
	transform: (raw: R) => T
	token?: string
	limit?: number
	cursor?: string
	append?: boolean
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
			headers: token ? { Authorization: `Bearer ${token}` } : {},
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
			headers: token ? { Authorization: `Bearer ${token}` } : {},
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
