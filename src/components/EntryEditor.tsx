import { useEffect, useRef, useState } from 'react'
import { MAX_ENTRIES, MAX_LABEL, type useEntries } from '../hooks/useEntries'
import './EntryEditor.css'

type Props = {
  store: ReturnType<typeof useEntries>
  /** El panel vive fuera de la pieza: se abre con E, para cargar antes del evento. */
  open: boolean
  disabled: boolean
  sound: boolean
  onSoundChange: (value: boolean) => void
  removeWinner: boolean
  onRemoveWinnerChange: (value: boolean) => void
  onClose: () => void
}

export function EntryEditor({
  store,
  open,
  disabled,
  sound,
  onSoundChange,
  removeWinner,
  onRemoveWinnerChange,
  onClose,
}: Props) {
  const { entries, add, remove, rename, recolor, replaceAll, shuffleEntries, reset, asText } = store
  const [draft, setDraft] = useState('')
  const [bulk, setBulk] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const scrollOnAdd = useRef(false)

  useEffect(() => {
    if (!scrollOnAdd.current) return
    scrollOnAdd.current = false
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [entries.length])

  const full = entries.length >= MAX_ENTRIES

  function submitDraft(event: React.FormEvent) {
    event.preventDefault()
    if (add(draft)) {
      setDraft('')
      scrollOnAdd.current = true
    }
  }

  return (
    <>
      {/* Sin `open` no se renderiza nada visible, pero el panel sigue montado:
          desmontarlo perdería el borrador a medio escribir cada vez que se
          cierra sin querer. */}
      <div
        className={`editorveil${open ? ' editorveil--on' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        className={`editor${open ? ' editor--on' : ''}`}
        aria-label="Premios de la ruleta"
        /* `inert` y no sólo `aria-hidden`: cerrado, el panel sigue montado y a
           un tabulador de distancia, y un foco que se va a un formulario
           invisible deja la pieza sin la barra espaciadora. */
        inert={!open}
      >
        <header className="editor__head">
          <div>
            <p className="kicker editor__kicker">Panel de carga</p>
            <h2 className="editor__title">Premios</h2>
          </div>
          <span className="editor__count">{String(entries.length).padStart(2, '0')}</span>
        </header>

        {bulk === null ? (
          <>
            {entries.length === 0 ? (
              <p className="editor__empty">
                La ruleta está vacía. Agregá un premio para empezar.
              </p>
            ) : (
              <ul className="editor__list" ref={listRef}>
                {entries.map((entry) => (
                  <li className="row" key={entry.id}>
                    <button
                      className="row__swatch"
                      type="button"
                      style={{ background: entry.color }}
                      onClick={() => recolor(entry.id)}
                      disabled={disabled}
                      aria-label={`Cambiar el color de ${entry.label}`}
                    />
                    <input
                      className="row__label"
                      value={entry.label}
                      maxLength={MAX_LABEL}
                      disabled={disabled}
                      onChange={(e) => rename(entry.id, e.target.value)}
                      aria-label="Premio"
                    />
                    <button
                      className="row__remove"
                      type="button"
                      onClick={() => remove(entry.id)}
                      disabled={disabled}
                      aria-label={`Quitar ${entry.label}`}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M4 4l8 8M12 4l-8 8" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form className="editor__add" onSubmit={submitDraft}>
              <input
                className="editor__input"
                value={draft}
                maxLength={MAX_LABEL}
                disabled={disabled || full}
                placeholder={full ? `${MAX_ENTRIES} es el máximo` : 'Agregar un premio'}
                onChange={(e) => setDraft(e.target.value)}
                aria-label="Premio nuevo"
              />
              <button
                className="btn btn--solid"
                type="submit"
                disabled={disabled || full || !draft.trim()}
              >
                Agregar
              </button>
            </form>

            <div className="editor__tools">
              <button
                className="btn"
                type="button"
                onClick={() => setBulk(asText)}
                disabled={disabled}
              >
                Editar como lista
              </button>
              <button
                className="btn"
                type="button"
                onClick={shuffleEntries}
                disabled={disabled || entries.length < 2}
              >
                Mezclar
              </button>
              <button className="btn" type="button" onClick={reset} disabled={disabled}>
                Restablecer
              </button>
            </div>
          </>
        ) : (
          <div className="editor__bulk">
            <label className="editor__hint" htmlFor="bulk">
              Un premio por línea.
            </label>
            <textarea
              id="bulk"
              className="editor__textarea"
              value={bulk}
              spellCheck={false}
              onChange={(e) => setBulk(e.target.value)}
            />
            <div className="editor__tools">
              <button
                className="btn btn--solid"
                type="button"
                onClick={() => {
                  replaceAll(bulk)
                  setBulk(null)
                }}
              >
                Usar estos premios
              </button>
              <button className="btn" type="button" onClick={() => setBulk(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="editor__switches">
          <label className="switch">
            <input
              type="checkbox"
              checked={removeWinner}
              disabled={disabled}
              onChange={(e) => onRemoveWinnerChange(e.target.checked)}
            />
            <span className="switch__track" aria-hidden="true">
              <span className="switch__knob" />
            </span>
            <span className="switch__text">Sacar al ganador de la ruleta</span>
          </label>

          <label className="switch">
            <input
              type="checkbox"
              checked={sound}
              onChange={(e) => onSoundChange(e.target.checked)}
            />
            <span className="switch__track" aria-hidden="true">
              <span className="switch__knob" />
            </span>
            <span className="switch__text">Sonido</span>
          </label>
        </div>

        <footer className="editor__foot">
          <button className="btn" type="button" onClick={onClose}>
            Cerrar
          </button>
          <p className="editor__keys">
            <kbd>E</kbd> abre y cierra este panel · <kbd>Espacio</kbd> gira la ruleta
          </p>
        </footer>
      </section>
    </>
  )
}
