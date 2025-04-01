// lib/utils/storage.ts
import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export function persist<T>(key: string, initialValue: T): Writable<T> {
	const storedValue = browser
		? (() => {
				try {
					const json = localStorage.getItem(key);
					return json ? JSON.parse(json) : initialValue;
				} catch {
					return initialValue;
				}
		  })()
		: initialValue;

	const store = writable<T>(storedValue);

	if (browser) {
		store.subscribe((value) => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	return store;
}