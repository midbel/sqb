import { defineConfig
 } from 'vitest/config'

export default defineConfig({
  test: {
    onConsoleLog: () => true,
    coverage: {
      reporter: ['html']
    }
  },
})