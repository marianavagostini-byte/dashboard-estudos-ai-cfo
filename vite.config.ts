import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages serves project sites from /<repository>/, while local development
// and previews stay at the root. The deploy workflow sets GITHUB_ACTIONS=true.
const repositoryBase = '/dashboard-estudos-ai-cfo/'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? repositoryBase : '/',
  plugins: [react()],
})
