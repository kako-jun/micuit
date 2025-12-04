import { useMemo } from 'react'
import styles from './DreamBackground.module.css'

interface Orb {
  id: number
  size: number
  x: number
  y: number
  color: string
  opacity: number
  duration: number
  delay: number
}

const COLORS = ['#4a3a5a', '#3a5a6a', '#5a3a4a', '#4a5a3a', '#3a4a5a', '#5a4a3a']

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function generateOrbs(count: number): Orb[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: randomBetween(250, 500),
    x: randomBetween(-10, 90),
    y: randomBetween(-10, 90),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    opacity: randomBetween(0.10, 0.18),
    duration: randomBetween(8, 15),
    delay: randomBetween(0, 10),
  }))
}

export function DreamBackground() {
  const orbs = useMemo(() => generateOrbs(5), [])

  return (
    <div className={styles.container}>
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className={styles.orb}
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: orb.color,
            opacity: orb.opacity,
            animationDuration: `${orb.duration}s, ${orb.duration * 0.8}s`,
            animationDelay: `${orb.delay}s, ${orb.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
