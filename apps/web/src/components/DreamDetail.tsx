import { useState, useRef } from 'react'
import type { DreamRecord, DreamImage } from '../types/dream'
import { analyzeDreamWithImage, generateDreamImage } from '../lib/llm'
import { saveDream } from '../lib/db'
import styles from './DreamDetail.module.css'

interface DreamDetailProps {
  dream: DreamRecord
  onClose: () => void
  onUpdate: (dream: DreamRecord) => void
}

export function DreamDetail({ dream, onClose, onUpdate }: DreamDetailProps) {
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(dream.tokens.join('\n'))
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const result = await analyzeDreamWithImage(
      dream.id,
      content,
      analysisCount,
      dream.lastContentHash
    )

    if (result.success && result.analysis) {
      // AI生成画像があれば追加
      const newImages = [...(dream.images || [])]
      if (result.image) {
        const aiImage: DreamImage = {
          id: crypto.randomUUID(),
          data: result.image,
          source: 'ai',
          createdAt: Date.now(),
        }
        newImages.push(aiImage)
      }

      const updatedDream: DreamRecord = {
        ...dream,
        analysisCount: result.newAnalysisCount,
        lastContentHash: result.contentHash,
        lastAnalysis: result.analysis,
        images: newImages,
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

  const handleGenerateImage = async () => {
    setImageLoading(true)
    setError(null)

    const content = dream.tokens.join('\n')
    const result = await generateDreamImage(content)

    if (result.success && result.image) {
      const newImage: DreamImage = {
        id: crypto.randomUUID(),
        data: result.image,
        source: 'ai',
        createdAt: Date.now(),
      }
      const updatedDream: DreamRecord = {
        ...dream,
        images: [...(dream.images || []), newImage],
        updatedAt: Date.now(),
      }
      await saveDream(updatedDream)
      onUpdate(updatedDream)
    } else {
      setError(result.message || '画像生成に失敗しました')
    }

    setImageLoading(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const data = event.target?.result as string
      const newImage: DreamImage = {
        id: crypto.randomUUID(),
        data,
        source: 'user',
        createdAt: Date.now(),
      }
      const updatedDream: DreamRecord = {
        ...dream,
        images: [...(dream.images || []), newImage],
        updatedAt: Date.now(),
      }
      await saveDream(updatedDream)
      onUpdate(updatedDream)
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteImage = async (imageId: string) => {
    const updatedDream: DreamRecord = {
      ...dream,
      images: (dream.images || []).filter(img => img.id !== imageId),
      updatedAt: Date.now(),
    }
    await saveDream(updatedDream)
    onUpdate(updatedDream)
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

            {/* 画像セクション */}
            <div className={styles.imagesSection}>
              <h3 className={styles.imagesSectionTitle}>画像</h3>

              {dream.images && dream.images.length > 0 && (
                <div className={styles.imagesGrid}>
                  {dream.images.map((image) => (
                    <div key={image.id} className={styles.imageItem}>
                      <img src={image.data} alt="夢の画像" />
                      <button
                        className={styles.imageDeleteButton}
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        ×
                      </button>
                      <span className={styles.imageSource}>
                        {image.source === 'ai' ? 'AI' : 'UP'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.imageActions}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenInput}
                  onChange={handleImageUpload}
                />
                <button
                  className={styles.uploadButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  写真を追加
                </button>
                <button
                  className={styles.generateButton}
                  onClick={handleGenerateImage}
                  disabled={imageLoading}
                >
                  {imageLoading ? '生成中...' : 'AIで生成'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
