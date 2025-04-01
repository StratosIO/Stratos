// $lib/utils/items.ts
import type { Writable } from 'svelte/store'

export async function deleteRemoteItem({
	id,
	endpoint,
	resource,
	authToken = 'AUTH_TOKEN_PLACEHOLDER',
}: {
	id: string | number
	endpoint: string
	resource: string
	authToken?: string
}): Promise<boolean> {
	const path = `${endpoint}/${resource}/${id}`
	try {
		const response = await fetch(path, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${authToken}` },
		})
		const result = await response.json()
		if (!response.ok) {
			console.error(`Remote deletion failed:`, result)
			return false
		}
		console.log(`${resource} deleted successfully:`, result)
		return true
	} catch (error) {
		console.error(`Error deleting ${resource}:`, error)
		return false
	}
}

export async function fetchRemoteItems<T>({
	endpoint,
	resource,
	store,
	transform,
	authToken = 'AUTH_TOKEN_PLACEHOLDER',
	limit = 50,
	cursor,
	append = false,
}: {
	endpoint: string
	resource: string
	store: Writable<T[]>
	transform: (raw: any) => T
	authToken?: string
	limit?: number
	cursor?: string
	append?: boolean
}): Promise<{ nextCursor: string | null; hasMore: boolean }> {
	const params = new URLSearchParams({ limit: String(limit) })
	if (cursor) params.set('cursor', cursor)

	const url = `${endpoint}/${resource}?${params.toString()}`

	try {
		const res = await fetch(url, {
			headers: { Authorization: `Bearer ${authToken}` },
		})
		const json = await res.json()

		if (!res.ok || !json.success) {
			console.error(`Failed to fetch ${resource}:`, json)
			return { nextCursor: null, hasMore: false }
		}

		const items = json.data.map(transform) as T[]

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

export async function fetchAllRemoteItems<T>({
	endpoint,
	resource,
	store,
	transform,
	authToken = 'AUTH_TOKEN_PLACEHOLDER',
	limit = 10,
}: {
	endpoint: string
	resource: string
	store: Writable<T[]>
	transform: (raw: any) => T
	authToken?: string
	limit?: number
}): Promise<void> {
	let cursor: string | undefined
	let hasMore = true

	store.set([])

	while (hasMore) {
		const result = await fetchRemoteItems({
			endpoint,
			resource,
			store,
			transform,
			authToken,
			limit,
			cursor,
			append: true,
		})

		cursor = result.nextCursor ?? undefined
		hasMore = result.hasMore
	}
}
