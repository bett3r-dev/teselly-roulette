/**
 * El logo de Teselly, extraído de `landing/public/logo-horizontal.svg`.
 *
 * Va inline y no como <img> porque la tipografía del logotipo tiene que poder
 * ir en blanco: sobre el teal profundo del fondo el `#006974` original del
 * logotipo casi desaparece. La TESELA conserva sus tres teales —es lo que la
 * hace reconocible— y las letras toman `currentColor`.
 */

type Props = { className?: string }

/** Sólo la tesela, para el cubo de la rueda. viewBox 0 0 104.44 120.6. */
export function TesellyMark({ className }: Props) {
  return (
    <svg viewBox="0 0 104.44 120.6" className={className} role="img" aria-label="Teselly">
      <polygon fill="#99c3c8" points="104.44 71.8 86.79 81.56 87.46 100.25 104.44 90.45 104.44 71.8" />
      <polygon
        fill="#006974"
        points="80.59 51.06 59 64.12 59 97.47 36.51 111.53 52.22 120.6 74.17 107.93 72.94 73.73 97.24 60.29 80.59 51.06"
      />
      <polygon
        fill="#4c969e"
        points="0 30.15 0 56.25 30.13 72.45 30.13 99.53 45.44 89.96 45.44 64.17 16.57 47.09 16.57 20.58 0 30.15"
      />
      <polygon fill="#006974" points="0 71.64 0 90.45 16.57 100.02 16.57 80.55 0 71.64" />
      <polygon fill="#4c969e" points="52.22 18.13 67.69 8.93 52.22 0 36.76 8.93 52.22 18.13" />
      <polygon
        fill="#99c3c8"
        points="104.44 48.79 104.44 30.15 81.14 16.7 52.22 33.9 30.13 20.76 30.13 39.36 52.18 52.4 80.29 35.39 104.44 48.79"
      />
    </svg>
  )
}

/** Tesela + logotipo. viewBox 0 0 415.21 120.6. */
export function TesellyLogo({ className }: Props) {
  return (
    <svg viewBox="0 0 415.21 120.6" className={className} role="img" aria-label="Teselly">
      <polygon fill="#99c3c8" points="104.44 71.8 86.79 81.56 87.46 100.25 104.44 90.45 104.44 71.8" />
      <polygon
        fill="#006974"
        points="80.59 51.06 59 64.12 59 97.47 36.51 111.53 52.22 120.6 74.17 107.93 72.94 73.73 97.24 60.29 80.59 51.06"
      />
      <polygon
        fill="#4c969e"
        points="0 30.15 0 56.25 30.13 72.45 30.13 99.53 45.44 89.96 45.44 64.17 16.57 47.09 16.57 20.58 0 30.15"
      />
      <polygon fill="#006974" points="0 71.64 0 90.45 16.57 100.02 16.57 80.55 0 71.64" />
      <polygon fill="#4c969e" points="52.22 18.13 67.69 8.93 52.22 0 36.76 8.93 52.22 18.13" />
      <polygon
        fill="#99c3c8"
        points="104.44 48.79 104.44 30.15 81.14 16.7 52.22 33.9 30.13 20.76 30.13 39.36 52.18 52.4 80.29 35.39 104.44 48.79"
      />

      {/* T-E-S-E-L-L-Y — en currentColor para que suba a blanco sobre el fondo oscuro. */}
      <g fill="currentColor">
        <polygon points="226.92 48.34 226.85 57.38 232.83 63.45 253.14 63.6 255.83 66.3 255.81 69.34 253.07 72.03 226.74 71.83 226.7 77.9 256.26 78.13 262.32 72.15 262.39 63.63 256.41 57.56 236.06 57.4 233.41 54.67 233.44 51.11 236.12 48.46 262.5 48.66 262.55 42.59 232.99 42.37 226.92 48.34" />
        <polygon points="139.1 47.24 153.6 47.35 153.37 77.01 159.91 77.06 160.13 47.4 174.68 47.52 174.72 41.58 139.14 41.31 139.1 47.24" />
        <polygon points="183.02 77.23 218.6 77.5 218.65 71.43 189.6 71.21 189.66 62.78 212.9 62.96 212.95 56.89 189.71 56.71 189.78 47.77 218.83 47.99 218.87 41.92 183.29 41.65 183.02 77.23" />
        <polygon points="271.39 78.24 306.97 78.52 307.02 72.45 277.97 72.22 278.03 63.79 301.27 63.97 301.32 57.9 278.08 57.72 278.15 48.78 307.2 49 307.24 42.93 271.66 42.66 271.39 78.24" />
        <polygon points="322.81 43.05 316.27 43 316 78.58 345.77 78.81 345.82 72.83 322.58 72.66 322.81 43.05" />
        <polygon points="359.67 43.35 353.14 43.3 352.86 78.88 382.64 79.11 382.68 73.13 359.45 72.95 359.67 43.35" />
        <polygon points="392.49 58.09 386.09 52.94 386.16 43.59 379.62 43.54 379.53 55.7 387.35 62.06 392.49 58.09" />
        <polygon points="408.67 43.76 408.6 53.11 397.28 61.94 397.26 61.93 393.99 64.46 393.99 79.24 400.43 79.29 400.52 67.48 414.98 56.08 415.11 55.97 415.21 43.81 408.67 43.76" />
      </g>
    </svg>
  )
}
