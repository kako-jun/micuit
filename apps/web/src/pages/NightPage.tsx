import { useState, useEffect } from 'react'
import { getStockedDreams } from '../lib/db'
import type { DreamRecord } from '../types/dream'
import styles from './NightPage.module.css'

const STORAGE_KEY = 'yumicuit-priming-id'

export function NightPage() {
  const [stockedDreams, setStockedDreams] = useState<DreamRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY)
    if (savedId) {
      setSelectedId(savedId)
    }

    getStockedDreams()
      .then(setStockedDreams)
      .finally(() => setLoading(false))
  }, [])

  const selectedDream = stockedDreams.find(d => d.id === selectedId)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    localStorage.setItem(STORAGE_KEY, id)
    setIsSelecting(false)
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>読み込み中...</p>
      </div>
    )
  }

  if (isSelecting) {
    return (
      <div className={styles.listContainer}>
        <h2 className={styles.listTitle}>また見たい夢を選ぶ</h2>
        {stockedDreams.length === 0 ? (
          <p className={styles.empty}>
            まだ夢ストックがありません。<br />
            昼モードで夢をストックに追加してください。
          </p>
        ) : (
          <div className={styles.list}>
            {stockedDreams.map((dream) => (
              <button
                key={dream.id}
                className={`${styles.dreamItem} ${dream.id === selectedId ? styles.selected : ''}`}
                onClick={() => handleSelect(dream.id)}
              >
                <span className={styles.dreamDate}>
                  {new Date(dream.createdAt).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className={styles.dreamPreview}>
                  {dream.tokens.slice(0, 2).join(' / ')}
                </span>
              </button>
            ))}
          </div>
        )}
        <button className={styles.cancelButton} onClick={() => setIsSelecting(false)}>
          戻る
        </button>
      </div>
    )
  }

  if (!selectedDream) {
    return (
      <div className={styles.container}>
        <p className={styles.empty}>
          また見たい夢を選びましょう
        </p>
        <button className={styles.selectButton} onClick={() => setIsSelecting(true)}>
          夢を選ぶ
        </button>
      </div>
    )
  }

  // プライミング表示: 画像とキーワードが流れ続ける
  const hasImages = selectedDream.images && selectedDream.images.length > 0

  return (
    <div className={styles.primingContainer} onClick={() => setIsSelecting(true)}>
      {hasImages && (
        <div className={styles.imageSlideshow}>
          {selectedDream.images!.map((image, i) => (
            <img
              key={image.id}
              src={image.data}
              alt=""
              className={styles.slideshowImage}
              style={{
                animationDelay: `${i * 8}s`,
                animationDuration: `${selectedDream.images!.length * 8}s`,
              }}
            />
          ))}
        </div>
      )}
      <div className={styles.flowingKeywords}>
        {selectedDream.tokens.map((token, i) => (
          <span
            key={i}
            className={styles.keyword}
            style={{
              animationDelay: `${i * 3}s`,
            }}
          >
            {token}
          </span>
        ))}
      </div>
      <p className={styles.hint}>タップして別の夢を選ぶ</p>
    </div>
  )
}
