import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { indexAtPointer } from './lib/geometry'

/**
 * Lo que dura un giro (`SPIN_MS` en useSpin). Los tests avanzan el reloj falso a
 * mano, así que si el giro se alarga y esto no, la rueda se lee a mitad de
 * camino y todo lo que dependa del resultado falla sin decir por qué.
 */
const SPIN = 9400

let clock = 0
let frames: FrameRequestCallback[] = []

beforeEach(() => {
  localStorage.clear()
  clock = 0
  frames = []
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {})
  Element.prototype.scrollTo = () => {}
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/** Step the fake clock, draining one frame per tick. */
function runFrames(ms: number, step = 50) {
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    if (!frames.length) return
    const due = frames
    frames = []
    clock += step
    act(() => due.forEach((cb) => cb(clock)))
  }
}

const rotation = () => {
  const transform = document.querySelector('.wheel__face')!.getAttribute('transform')!
  return Number.parseFloat(/rotate\(([-\d.]+)\)/.exec(transform)![1])
}

const labels = () =>
  [...document.querySelectorAll<HTMLInputElement>('.row__label')].map((input) => input.value)

/** Entry labels leak into button names ("Quitar Volvé a girar"), so target the hub itself. */
const spinButton = () => document.querySelector<HTMLButtonElement>('.spin')!
const spin = () => fireEvent.click(spinButton())
const announced = () => document.querySelector('.reveal__name')?.textContent

/**
 * El anuncio del ganador ya no tiene botones: es un cartel, y la barra
 * espaciadora es lo único que lo cierra. Los tests lo cierran igual que una
 * persona.
 */
const revealShown = () => document.querySelector('.reveal') !== null
const closeReveal = () => pressKey(' ')

const pressKey = (key: string) => fireEvent.keyDown(document.body, { key, code: keyCode(key) })
const keyCode = (key: string) => (key === ' ' ? 'Space' : `Key${key.toUpperCase()}`)

/**
 * El panel de carga vive fuera de la pieza y lo abre y cierra la tecla E.
 *
 * Leer la lista no necesita abrirlo —el panel queda montado, sólo corrido fuera
 * de pantalla— pero TOCARLO sí, igual que una persona. Y hay que volver a
 * cerrarlo antes de girar: con el panel abierto la barra espaciadora no gira,
 * porque se está escribiendo.
 */
const toggleEditor = () => pressKey('e')

describe('spinning the wheel', () => {
  it('announces the entry that is actually under the pointer', () => {
    render(<App />)
    const entries = labels()
    expect(spinButton()).toHaveProperty('ariaLabel', 'Girar la ruleta')

    spin()
    runFrames(SPIN + 1500)

    const landed = entries[indexAtPointer(rotation(), entries.length)]
    expect(announced()).toBe(landed)
  })

  it('winds back once to take a run-up, then turns clockwise the rest of the way', () => {
    render(<App />)
    spin()

    // Sample only while it is turning: on settle the angle is normalised back
    // under 360°, which renders identically but is not a reading of movement.
    const seen: number[] = []
    while (seen.length < 400) {
      runFrames(100, 50)
      if (revealShown()) break
      seen.push(rotation())
    }

    // El culatazo: retrocede un poco al arrancar, y no más de lo declarado — un
    // retroceso grande no se lee como impulso, se lee como que gira al revés.
    const lowest = Math.min(...seen)
    expect(lowest).toBeLessThan(0)
    expect(lowest).toBeGreaterThan(-25)

    // Y a partir de ahí no vuelve a retroceder ni una vez.
    const after = seen.slice(seen.indexOf(lowest))
    expect(after.filter((r, i) => i > 0 && r < after[i - 1])).toEqual([])
    expect(Math.max(...seen)).toBeGreaterThan(4 * 360)
  })

  it('starts from a standstill instead of snapping to full speed', () => {
    render(<App />)
    spin()

    // Se deja pasar el culatazo (12% de los 9.4 s ≈ 1130 ms) y se mide el tramo
    // siguiente, que es donde la curva vieja saltaba a velocidad máxima de un
    // cuadro al otro — lo que se sentía instantáneo.
    runFrames(1200, 50)

    const seen: number[] = []
    while (seen.length < 13) {
      runFrames(50, 50)
      seen.push(rotation())
    }

    // Cada cuadro avanza MÁS que el anterior: la rueda está acelerando, no
    // arrancando a fondo. (13 cuadros son 650 ms, cómodamente dentro del tramo
    // de aceleración, que termina cerca de los 2.5 s.)
    const steps = seen.slice(1).map((r, i) => r - seen[i])
    expect(steps.every((d, i) => i === 0 || d > steps[i - 1])).toBe(true)
  })

  it('lands on every entry over many spins, and only on real entries', { timeout: 30_000 }, () => {
    render(<App />)
    const entries = labels()
    const hits = new Set<string>()

    for (let i = 0; i < 40; i++) {
      spin()
      runFrames(SPIN + 1500, 400)
      const landed = entries[indexAtPointer(rotation(), entries.length)]
      expect(entries).toContain(landed)
      hits.add(landed)
      // La barra cierra el anuncio Y relanza el giro en el mismo gesto, así que
      // hay que dejar terminar ese giro antes de leer el siguiente.
      closeReveal()
      runFrames(SPIN + 1500, 400)
    }

    // Los premios se repiten a propósito (cinco «1 mes gratis», cuatro «seguí
    // participando»…), así que contar etiquetas distintas es lo único que tiene
    // sentido: nunca va a haber 20 etiquetas diferentes.
    expect(hits.size).toBe(new Set(entries).size)
  })

  it('cannot be started again while it is still turning', () => {
    render(<App />)
    spin()
    runFrames(1000)

    expect(spinButton().disabled).toBe(true)
    const midSpin = rotation()
    spin() // ignored — a second spin must not stack on the first
    runFrames(SPIN + 1500)

    expect(rotation()).not.toBe(midSpin)
    expect(revealShown()).toBe(true)
    expect(spinButton().disabled).toBe(false)
  })
})

/**
 * La barra espaciadora es el ÚNICO gesto humano de la pieza terminada: el
 * televisor está a varios metros y no hay puntero. Si esto se rompe, la pantalla
 * queda decorativa, así que se prueba el atajo y no sólo el botón.
 */
describe('the space bar, which is the whole interface', () => {
  it('takes two presses to spin again: one closes the reveal, the next fires', () => {
    render(<App />)

    pressKey(' ')
    runFrames(SPIN + 1500)
    expect(revealShown()).toBe(true)

    // La PRIMERA sólo cierra el anuncio. Que cerrar disparara el giro dejaba a
    // quien se acercaba con la rueda ya girando sin haberla pedido.
    pressKey(' ')
    runFrames(1000)
    expect(revealShown()).toBe(false)
    expect(spinButton().disabled).toBe(false)

    // La SEGUNDA es la que la tira.
    pressKey(' ')
    runFrames(1000)
    expect(spinButton().disabled).toBe(true)
  })

  it('returns to rest on its own when nobody dismisses the winner', () => {
    // Sólo los temporizadores: `performance.now` ya está simulado por el reloj
    // de cuadros de arriba, y dejar que los falsos se lo lleven puesto rompería
    // el giro antes de llegar al anuncio.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    render(<App />)

    spin()
    runFrames(SPIN + 1500)
    expect(revealShown()).toBe(true)

    // Nadie toca nada: la pantalla de un stand no puede quedarse clavada en el
    // anuncio hasta que alguien pase.
    act(() => vi.advanceTimersByTime(25_000))
    expect(revealShown()).toBe(false)
  })

  it('does not spin while the loading panel is open', () => {
    render(<App />)
    toggleEditor()

    pressKey(' ')
    runFrames(SPIN + 1500)

    expect(revealShown()).toBe(false)
    expect(rotation()).toBe(0)
  })
})

describe('taking the winner off the wheel', () => {
  it('leaves the winner on screen until the reveal is dismissed, then removes it', () => {
    render(<App />)
    toggleEditor()
    fireEvent.click(screen.getByLabelText(/sacar al ganador de la ruleta/i))
    toggleEditor() // cerrado, o la barra no gira
    const before = labels()

    spin()
    runFrames(SPIN + 1500)

    const landed = before[indexAtPointer(rotation(), before.length)]
    expect(announced()).toBe(landed)
    expect(labels()).toEqual(before) // still on the wheel while everyone is looking

    closeReveal()
    // Se va UN gajo, no todos los que digan lo mismo: los repetidos son el stock
    // del premio y se gastan de a uno. Cuál de las copias salió es cosa del
    // giro, así que se comparan cantidades y no posiciones.
    const contar = (ls: string[]) =>
      ls.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l]: (acc[l] ?? 0) + 1 }), {})
    const esperado = contar(before)
    esperado[landed] -= 1
    if (!esperado[landed]) delete esperado[landed]
    expect(contar(labels())).toEqual(esperado)
  })

  it('spins again against the shortened list', () => {
    render(<App />)
    const STARTER_COUNT = labels().length
    toggleEditor()
    fireEvent.click(screen.getByLabelText(/sacar al ganador de la ruleta/i))
    toggleEditor() // cerrado, o la barra no gira

    spin()
    runFrames(SPIN + 1500)
    // La barra cierra el anuncio y relanza el giro en el mismo gesto.
    closeReveal()

    const remaining = labels()
    expect(remaining).toHaveLength(STARTER_COUNT - 1)

    runFrames(SPIN + 1500)
    const landed = remaining[indexAtPointer(rotation(), remaining.length)]
    expect(remaining).toContain(landed)
  })
})

describe('editing entries', () => {
  it('adds, renames and removes entries', () => {
    render(<App />)
    toggleEditor()
    const start = labels().length

    fireEvent.change(screen.getByLabelText('Premio nuevo'), { target: { value: 'Silla en primera fila' } })
    fireEvent.click(screen.getByRole('button', { name: /^agregar$/i }))
    expect(labels()).toContain('Silla en primera fila')
    expect(labels()).toHaveLength(start + 1)

    fireEvent.change(screen.getAllByLabelText('Premio')[0], { target: { value: 'Renombrado' } })
    expect(labels()[0]).toBe('Renombrado')

    fireEvent.click(screen.getByRole('button', { name: /quitar renombrado/i }))
    expect(labels()).toHaveLength(start)
    expect(labels()).not.toContain('Renombrado')
  })

  it('replaces the whole list from pasted text, keeping colours of entries that stayed', () => {
    render(<App />)
    toggleEditor()
    const keptColor = document.querySelector<HTMLElement>('.row__swatch')!.style.background
    const kept = labels()[0]

    fireEvent.click(screen.getByRole('button', { name: /editar como lista/i }))
    fireEvent.change(screen.getByLabelText(/un premio por línea/i), {
      target: { value: `${kept}\n  Con espacios  \n\n\nSegundo\n` },
    })
    fireEvent.click(screen.getByRole('button', { name: /usar estos premios/i }))

    expect(labels()).toEqual([kept, 'Con espacios', 'Segundo'])
    expect(document.querySelector<HTMLElement>('.row__swatch')!.style.background).toBe(keptColor)
  })

  it('survives a reload, and shrugs off a corrupt saved wheel', () => {
    const { unmount } = render(<App />)
    toggleEditor()
    fireEvent.change(screen.getByLabelText('Premio nuevo'), { target: { value: 'Persistido' } })
    fireEvent.click(screen.getByRole('button', { name: /^agregar$/i }))
    unmount()

    render(<App />)
    expect(labels()).toContain('Persistido')
    cleanup()

    localStorage.setItem('teselly-wheel.entries', '{"not":"a list"}')
    render(<App />)
    expect(labels().length).toBeGreaterThan(0)
  })
})
