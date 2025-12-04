import { useEffect, useState } from 'react'
import { getAllDreams, addToStock, isInStock, removeFromStock } from '../lib/db'
import type { DreamRecord } from '../types/dream'
import { DreamDetail } from './DreamDetail'
import styles from './DreamList.module.css'

export function DreamList() {
  const [dreams, setDreams] = useState<DreamRecord[]>([])
  const [stockedIds, setStockedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedDream, setSelectedDream] = useState<DreamRecord | null>(null)

  useEffect(() => {
    async function load() {
      const allDreams = await getAllDreams()
      setDreams(allDreams)

      const stocked = new Set<string>()
      for (const dream of allDreams) {
        if (await isInStock(dream.id)) {
          stocked.add(dream.id)
        }
      }
      setStockedIds(stocked)
      setLoading(false)
    }
    load()
  }, [])

  const handleDreamUpdate = (updatedDream: DreamRecord) => {
    setDreams(prev => prev.map(d => d.id === updatedDream.id ? updatedDream : d))
    setSelectedDream(updatedDream)
  }

  const handleToggleStock = async (dream: DreamRecord, e: React.MouseEvent) => {
    e.stopPropagation()
    if (stockedIds.has(dream.id)) {
      await removeFromStock(dream.id)
      setStockedIds(prev => {
        const next = new Set(prev)
        next.delete(dream.id)
        return next
      })
    } else {
      await addToStock(dream)
      setStockedIds(prev => new Set(prev).add(dream.id))
    }
  }

  if (loading) {
    return <div className={styles.empty}>読み込み中...</div>
  }

  if (dreams.length === 0) {
    return <div className={styles.empty}>まだ夢の記録がありません</div>
  }

  return (
    <>
      <div className={styles.list}>
        {dreams.map((dream) => (
          <DreamCard
            key={dream.id}
            dream={dream}
            isStocked={stockedIds.has(dream.id)}
            onToggleStock={(e) => handleToggleStock(dream, e)}
            onClick={() => setSelectedDream(dream)}
          />
        ))}
      </div>

      {selectedDream && (
        <DreamDetail
          dream={selectedDream}
          onClose={() => setSelectedDream(null)}
          onUpdate={handleDreamUpdate}
        />
      )}
    </>
  )
}

interface DreamCardProps {
  dream: DreamRecord
  isStocked: boolean
  onToggleStock: (e: React.MouseEvent) => void
  onClick: () => void
}

function DreamCard({ dream, isStocked, onToggleStock, onClick }: DreamCardProps) {
  const date = new Date(dream.createdAt)
  const dateStr = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const preview = dream.tokens.slice(0, 3).join(' / ')
  const hasMore = dream.tokens.length > 3

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <span className={styles.date}>
          {dateStr} {timeStr}
        </span>
        <button
          className={`${styles.stockButton} ${isStocked ? styles.stocked : ''}`}
          onClick={onToggleStock}
          title={isStocked ? 'ストックから削除' : 'ストックに追加'}
        >
          {isStocked ? '★' : '☆'}
        </button>
      </div>
      <div className={styles.content}>
        {preview}
        {hasMore && <span className={styles.more}>...</span>}
      </div>
    </div>
  )
}
