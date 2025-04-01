// $lib/utils/items.ts
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
