import { memo, useEffect, useState } from 'react'
import { BEATS, CANALES, RIBBON } from '../lib/content'
import { Scene } from './Scenes'
import './Showreel.css'

/**
 * FRANJA 3 — el bucle.
 *
 * Una pantalla que pasa fichas y vuelve a empezar, y debajo dos cintas que no
 * paran nunca. Sin principio ni final visible y sin esperar un click.
 *
 * La ficha es TÍTULO ARRIBA, PANTALLA ABAJO. El título se lleva el ancho entero
 * de la franja, y por eso puede ser enorme —76 px de lienzo, o sea 152 px reales
 * en el 4K— sin partirse en cuatro renglones. Es la única disposición de las que
 * se probaron en la que el texto se lee de una pasada desde el fondo del salón,
 * que es la prueba que tiene que pasar.
 *
 * La pantalla que queda debajo es un BANNER MUY ANCHO (unos 2.5:1), y eso cambia
 * el problema de cada escena: casi todas cuentan un recorrido de izquierda a
 * derecha, y ése es justo el formato que le queda bien a un recorrido.
 *
 * El guion (`lib/content.ts`) recorre la landing en su propio orden: primero
 * cómo se entra (migrá sin riesgo), después por qué (los tres pilares), y al
 * final qué hay adentro (el producto, módulo por módulo).
 *
 * Cada ficha dura lo suyo (`beat.ms`) en vez de un intervalo fijo: la de
 * migración tiene cuatro pasos que mostrar y necesita el doble que una que
 * muestra una sola cosa.
 */
export const Showreel = memo(function Showreel() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => setI((n) => (n + 1) % BEATS.length), BEATS[i].ms)
    return () => clearTimeout(id)
  }, [i])

  const beat = BEATS[i]

  return (
    <section className="reel" aria-label="Qué hacemos">
      {/*
        `key` fuerza el remontaje del texto y de la escena en cada ficha, y ese
        remontaje es lo que dispara sus animaciones de entrada desde cero. Sin él
        React reusaría los nodos y todo cambiaría de golpe, sin transición.
      */}
      <div className="reel__card">
        <div className="reel__caption" key={`${beat.id}-cap`}>
          <h2 className="reel__title">{beat.title}</h2>
        </div>

        <div className="reel__screen">
          <div className="reel__scene" key={beat.id}>
            <Scene kind={beat.scene} />
          </div>
        </div>
      </div>

      {/*
        Las dos cintas. Cada una lleva DOS MITADES IDÉNTICAS y se traslada -50%:
        a esa altura la segunda cae exactamente donde arrancó la primera, así que
        el ciclo cierra sin salto. Es la técnica del marquee de la landing.
      */}
      <div className="marq marq--feat" aria-hidden="true">
        <div className="marq__track">
          {[0, 1].map((half) => (
            <div className="marq__half" key={half}>
              {RIBBON.map((text) => (
                <span className="marq__word" key={text}>
                  {text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="marq marq--logos" aria-hidden="true">
        <div className="marq__track">
          {/* Cuatro copias y no dos: la fila de canales es corta, y en una
              pantalla de 2160 de ancho dos no llegan a cubrir el recorrido —
              se vería el hueco entre el final de una y el arranque de la otra. */}
          {[0, 1, 2, 3].map((copy) => (
            <div className="marq__half" key={copy}>
              {CANALES.map((c) => (
                <img
                  className="marq__logo"
                  key={c.file}
                  src={`/brands/${c.file}`}
                  alt=""
                  decoding="async"
                  style={
                    {
                      '--logo-h': `${c.h}rem`,
                      '--logo-y': 'y' in c ? c.y : '0',
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})
