<script lang="ts">
	import '../app.css'
	import 'material-icons/iconfont/material-icons.css'
	import { serverStatus, endpoint, files, tasks } from '$lib/stores'
	import { fetchAllRemoteItems } from '$lib/utils/items'
	import type { FileItem } from '$lib/types'
	import { get } from 'svelte/store'

	const { children } = $props()

	let wasOnline = get(serverStatus).online

	$effect(() => {
		if (!wasOnline && $serverStatus.online) {
			const ep = get(endpoint)

			fetchAllRemoteItems<FileItem, FileItem>({
				endpoint: ep,
				resource: 'uploads',
				store: files,
				transform: (raw) => ({
					...raw,
					icon: 'cloud_sync',
					progress: 100,
				}),
			})

			fetchAllRemoteItems({
				endpoint: ep,
				resource: 'tasks',
				store: tasks,
				transform: (r) => r,
			})
		}

		wasOnline = $serverStatus.online
	})
</script>

{@render children()}
