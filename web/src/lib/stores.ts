// lib/stores.ts
import { browser } from '$app/environment'
import { writable } from 'svelte/store'

export const files = writable<
  Array<{ id: string; file: File; thumb: string | null; icon: string }>
>([])
export const fileSelected = writable<number>(-1)
export const command = writable<string>('')
export const progress = writable<number>(0)
export const output = writable<string>('Placeholder output text...')
export const serverStatus = writable<{
  online: boolean
  uptime: string
  countdown: number
  counting: boolean
}>({
  online: false,
  uptime: '',
  countdown: 10,
  counting: false,
})
export const endpoint = writable<string>(browser ? window.location.origin + '/api' : '')
export const showConfigModal = writable<boolean>(false)
