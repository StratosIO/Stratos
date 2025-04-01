export type FileItem = {
	id: string
	name: string
	size: number
	type: string
	time: string
	icon?: string
	thumb?: string
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
}
