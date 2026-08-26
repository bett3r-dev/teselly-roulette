import gsap from 'gsap'

/**
 * PILAR 3 — adaptado de `landing/src/scripts/pillar3.ts`.
 *
 * Éste es el único de los tres que NO se puede copiar literal, y conviene decir
 * por qué. El de la landing no tiene un timeline: cuelga del ticker de GSAP y en
 * cada cuadro lee el rect de la maqueta para sacar dos cosas del SCROLL — cuánto
 * se movió (que usa para acelerar el flujo) y dónde está en la pantalla (que usa
 * para elegir la palabra que muestra la ficha). Acá no hay scroll: la pieza es
 * una pantalla fija. Ese archivo, traído tal cual, dejaría el flujo a velocidad
 * 1 para siempre y la palabra clavada en la primera.
 *
 * Así que se conserva el MECANISMO —el flujo es la animación CSS de
 * `.pilar3-stream-anim` y el script sólo le toca `playbackRate`; la palabra se
 * escribe directo y entra con un `fromTo`— y se cambia lo que lo alimenta: en
 * vez del scroll, un vaivén propio de velocidad y un reloj para las palabras. Es
 * la misma decisión que la landing ya tomó en el Pilar 1, que también se
 * autoabastece.
 */

/** Las palabras de "estar pensando" — `whereWeShine.viz3.thinking`. */
const THINKING = [
  'Cavilando…',
  'Rumiando…',
  'Maquinando…',
  'Elucubrando…',
  'Divagando…',
  'Conjurando…',
  'Tramando…',
  'Macerando…',
  'Barruntando…',
  'Hilvanando…',
] as const

/** Cada cuánto cambia la palabra. */
const WORD_MS = 1900

export function initPillar3(root: HTMLElement): () => void {
  const stream = root.querySelector<HTMLElement>('[data-pilar3-stream]')
  const textEl = root.querySelector<HTMLElement>('[data-pilar3-text]')
  if (!stream) return () => {}

  let anim: Animation | undefined
  let idx = 0

  /**
   * El vaivén de velocidad. En la landing esto es la velocidad del scroll; acá
   * es una respiración lenta entre 1× y ~2.6×, con `sine` para que no se note
   * dónde empieza. Sin esto el flujo corre a velocidad constante y se lee como
   * una cinta transportadora en vez de como una operación que va y viene.
   */
  const rate = { v: 1.2 }
  const pulse = gsap.to(rate, {
    v: 2.2,
    duration: 5.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  })

  /* El arranque adelantado y la velocidad base los pone el CSS (ver
     `.pilar3-stream-anim`). Acá sólo va el vaivén encima, y si rAF no llega el
     fondo igual se mueve. */
  const tick = () => {
    if (!anim && typeof stream.getAnimations === 'function') anim = stream.getAnimations()[0]
    if (anim) anim.playbackRate += (rate.v - anim.playbackRate) * 0.08
  }
  gsap.ticker.add(tick)

  // La palabra se escribe directo (nunca puede quedarse trabada) y entra con el
  // mismo `fromTo` de la landing.
  const swap = () => {
    if (!textEl) return
    textEl.textContent = THINKING[idx % THINKING.length]
    idx += 1
    gsap.fromTo(
      textEl,
      { opacity: 0.25, y: 3 },
      { opacity: 1, y: 0, duration: 0.2, ease: 'power1.out', overwrite: true },
    )
  }
  swap()
  const words = setInterval(swap, WORD_MS)

  return () => {
    clearInterval(words)
    gsap.ticker.remove(tick)
    pulse.kill()
    if (textEl) gsap.killTweensOf(textEl)
  }
}
