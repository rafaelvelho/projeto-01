/** PROTOTYPE switcher — not part of product UI */
type Props = {
  label: string
  onPrev: () => void
  onNext: () => void
}

export function PrototypeSwitcher({ label, onPrev, onNext }: Props) {
  return (
    <div className="proto-switcher" role="toolbar" aria-label="Variantes do protótipo">
      <button type="button" onClick={onPrev} aria-label="Variante anterior">
        ←
      </button>
      <span>{label}</span>
      <button type="button" onClick={onNext} aria-label="Próxima variante">
        →
      </button>
    </div>
  )
}
