import overpass from '$lib/assets/fonts/overpass.ttf?url'
import overpassMono from '$lib/assets/fonts/overpass-mono.ttf?url'
import overpassItalic from '$lib/assets/fonts/overpass-italic.ttf?url'
import favicon from '$lib/assets/favicon.svg?url'
import type { Handle } from '@sveltejs/kit'

export const handle = (async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html
        .replace('%app.icon.favicon%', favicon)
        .replace('%app.font%', overpass)
        .replace('%app.font.mono%', overpassMono)
        .replace('%app.font.italic%', overpassItalic)
    },
  })
}) satisfies Handle
