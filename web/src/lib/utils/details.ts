// $lib/utils/details.ts

export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 B'

	const k = 1024
	const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
}
