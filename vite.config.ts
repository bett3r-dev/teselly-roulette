import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // La pieza se publica en GitHub Pages bajo /teselly-roulette/, o sea que NO
  // cuelga de la raíz del dominio: sin esto los assets salen apuntando a / y la
  // página queda en blanco. En `vite dev` sigue siendo / como siempre.
  base: process.env.NODE_ENV === 'production' ? '/teselly-roulette/' : '/',
  plugins: [react()],
})
