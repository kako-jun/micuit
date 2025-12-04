import { useState } from 'react'
import type { DreamRecord } from '../types/dream'
import { analyzeDream } from '../lib/llm'
import { saveDream } from '../lib/db'
import styles from './DreamDetail.module.css'

interface DreamDetailProps {
  dream: DreamRecord
  onClose: () => void
  onUpdate: (dream: DreamRecord) => void
}

export function DreamDetail({ dream, onClose, onUpdate }: DreamDetailProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(dream.tokens.join('\n'))

  const date = new Date(dream.createdAt)
  const dateStr = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  const timeStr = date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const analysisCount = dream.analysisCount || 0
  const remainingAnalyses = 3 - analysisCount

  // フリーザのセリフパロディ
  const getFreezaQuote = () => {
    if (remainingAnalyses <= 0) {
      return 'これが...最終形態だ...'
    }
    return `まだ${remainingAnalyses}回も分析を残している...この意味がわかるな？`
  }

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    const content = dream.tokens.join('\n')
    const result = await analyzeDream(
      dream.id,
      content,
      analysisCount,
      dream.lastContentHash
    )

    if (result.success && result.analysis) {
      const updatedDream: DreamRecord = {
        ...dream,
        analysisCount: result.newAnalysisCount,
        lastContentHash: result.contentHash,
        lastAnalysis: result.analysis,
        updatedAt: Date.now(),
      }
      await saveDream(updatedDream)
      onUpdate(updatedDream)
    } else {
      setError(result.message || 'エラーが発生しました')
    }

    setLoading(false)
  }

  const handleSaveEdit = async () => {
    const newTokens = editText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const updatedDream: DreamRecord = {
      ...dream,
      tokens: newTokens,
      updatedAt: Date.now(),
    }
    await saveDream(updatedDream)
    onUpdate(updatedDream)
    setIsEditing(false)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.date}>{dateStr} {timeStr}</span>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        {isEditing ? (
          <div className={styles.editSection}>
            <textarea
              className={styles.editArea}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className={styles.editActions}>
              <button className={styles.cancelButton} onClick={() => setIsEditing(false)}>
                キャンセル
              </button>
              <button className={styles.saveButton} onClick={handleSaveEdit}>
                保存
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.content} onClick={() => setIsEditing(true)}>
              {dream.tokens.map((token, i) => (
                <p key={i} className={styles.token}>{token}</p>
              ))}
              <p className={styles.editHint}>タップして編集</p>
            </div>

            <div className={styles.actions}>
              <p className={styles.freezaQuote}>{getFreezaQuote()}</p>
              <button
                className={styles.analyzeButton}
                onClick={handleAnalyze}
                disabled={loading || remainingAnalyses <= 0}
              >
                {loading ? '分析中...' : remainingAnalyses > 0 ? 'AIに分析させる' : '分析不可'}
              </button>
            </div>

            {error && (
              <div className={styles.error}>{error}</div>
            )}

            {dream.lastAnalysis && (
              <div className={styles.analysis}>
                <h3 className={styles.analysisTitle}>AIの分析</h3>
                <div className={styles.analysisContent}>
                  {dream.lastAnalysis.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
