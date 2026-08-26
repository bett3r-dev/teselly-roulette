import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Los tests avanzan el reloj a mano y un giro dura 17 s: con el tope de 5 s
    // que trae por defecto, cualquier test que espere un giro entero se corta.
    testTimeout: 30_000,
  },
})
