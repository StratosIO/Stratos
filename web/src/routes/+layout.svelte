<script lang="ts">
	import '../app.css'
	import 'material-icons/iconfont/material-icons.css'
	import { serverStatus, endpoint, files, tasks } from '$lib/stores'
	import { fetchAllRemoteItems } from '$lib/utils/items'
	import { get } from 'svelte/store'

	const { children } = $props()

	let wasOnline = get(serverStatus).online

	$effect(() => {
		if (!wasOnline && $serverStatus.online) {
			const ep = get(endpoint)

			fetchAllRemoteItems({
				endpoint: ep,
				resource: 'uploads',
				store: files,
				transform: (raw) => ({
					id: raw.id,
					name: raw.file_name,
					size: raw.file_size,
					type: raw.mime_type,
					time: raw.uploaded_at,
					icon: 'cloud_sync',
					progress: 100,
				}),
			})

			fetchAllRemoteItems({
				endpoint: ep,
				resource: 'tasks',
				store: tasks,
				transform: (raw) => raw,
			})
		}
		wasOnline = get(serverStatus).online
	})
</script>

{@render children()}
