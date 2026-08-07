import { useEffect, useRef, useState } from 'react'
import { MAX_ENTRIES, MAX_LABEL, type useEntries } from '../hooks/useEntries'
import './EntryEditor.css'

type Props = {
  store: ReturnType<typeof useEntries>
  disabled: boolean
  removeWinner: boolean
  onRemoveWinnerChange: (value: boolean) => void
}

export function EntryEditor({ store, disabled, removeWinner, onRemoveWinnerChange }: Props) {
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
    <section className="editor" aria-label="Wheel entries">
      <header className="editor__head">
        <h2 className="editor__title">Entries</h2>
        <span className="editor__count">{String(entries.length).padStart(2, '0')}</span>
      </header>

      {bulk === null ? (
        <>
          {entries.length === 0 ? (
            <p className="editor__empty">Nothing on the wheel yet. Add an entry to get started.</p>
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
                    aria-label={`Change the colour of ${entry.label}`}
                  />
                  <input
                    className="row__label"
                    value={entry.label}
                    maxLength={MAX_LABEL}
                    disabled={disabled}
                    onChange={(e) => rename(entry.id, e.target.value)}
                    aria-label="Entry"
                  />
                  <button
                    className="row__remove"
                    type="button"
                    onClick={() => remove(entry.id)}
                    disabled={disabled}
                    aria-label={`Remove ${entry.label}`}
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
              placeholder={full ? `${MAX_ENTRIES} is the limit` : 'Add an entry'}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="New entry"
            />
            <button className="btn btn--brass" type="submit" disabled={disabled || full || !draft.trim()}>
              Add
            </button>
          </form>

          <div className="editor__tools">
            <button className="btn" type="button" onClick={() => setBulk(asText)} disabled={disabled}>
              Edit as list
            </button>
            <button className="btn" type="button" onClick={shuffleEntries} disabled={disabled || entries.length < 2}>
              Shuffle
            </button>
            <button className="btn" type="button" onClick={reset} disabled={disabled}>
              Reset
            </button>
          </div>
        </>
      ) : (
        <div className="editor__bulk">
          <label className="editor__hint" htmlFor="bulk">
            One entry per line.
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
              className="btn btn--brass"
              type="button"
              onClick={() => {
                replaceAll(bulk)
                setBulk(null)
              }}
            >
              Use these entries
            </button>
            <button className="btn" type="button" onClick={() => setBulk(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

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
        <span className="switch__text">Take the winner off the wheel</span>
      </label>
    </section>
  )
}
