import { useLocation, useNavigate } from 'react-router-dom'
import styles from './ModeSwitch.module.css'

export type Mode = 'morning' | 'daytime' | 'night'

const MODES: { key: Mode; path: string; label: string }[] = [
  { key: 'morning', path: '/morning', label: '朝' },
  { key: 'daytime', path: '/daytime', label: '昼' },
  { key: 'night', path: '/night', label: '夜' },
]

export function ModeSwitch() {
  const location = useLocation()
  const navigate = useNavigate()

  const currentMode = MODES.find(m => m.path === location.pathname)?.key || 'morning'

  return (
    <div className={styles.container}>
      {MODES.map(({ key, path, label }) => (
        <button
          key={key}
          className={`${styles.button} ${currentMode === key ? styles.active : ''}`}
          onClick={() => navigate(path)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
