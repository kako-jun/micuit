import { useEffect, forwardRef } from 'react'
import styles from './DreamInput.module.css'

interface DreamInputProps {
  value: string
  onChange: (value: string) => void
}

export const DreamInput = forwardRef<HTMLTextAreaElement, DreamInputProps>(
  function DreamInput({ value, onChange }, ref) {
    useEffect(() => {
      // Auto-focus on mount
      if (ref && 'current' in ref && ref.current) {
        ref.current.focus()
      }
    }, [ref])

    useEffect(() => {
      // Auto-resize textarea
      if (ref && 'current' in ref && ref.current) {
        const textarea = ref.current
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [value, ref])

    return (
      <textarea
        ref={ref}
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    )
  }
)
