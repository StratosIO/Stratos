import containerQueries from '@tailwindcss/container-queries'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Overpass', 'sans-serif'],
        mono: ['Overpass Mono', 'monospace'],
      },
      colors: {
        primary: 'rgb(var(--custom-primary) / <alpha-value>)',
        dark: 'rgb(var(--custom-dark) / <alpha-value>)',
        light: 'rgb(var(--custom-light) / <alpha-value>)',
        success: 'rgb(var(--custom-success) / <alpha-value>)',
        danger: 'rgb(var(--custom-danger) / <alpha-value>)',
        warning: 'rgb(var(--custom-warning) / <alpha-value>)',
        info: 'rgb(var(--custom-info) / <alpha-value>)',
        pale: 'rgb(var(--custom-pale) / <alpha-value>)',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--custom-default-border) / <alpha-value>)',
      },
    },
  },
  plugins: [typography, forms, containerQueries],
} satisfies Config
