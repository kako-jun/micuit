import { useState, useCallback, useRef } from 'react'
import { DreamInput } from '../components/DreamInput'
import { MicButton } from '../components/MicButton'
import { DreamQuestionnaire } from '../components/DreamQuestionnaire'
import { DreamDetail } from '../components/DreamDetail'
import { useAutoSave } from '../hooks/useAutoSave'
import { saveDream } from '../lib/db'
import { analyzeDream } from '../lib/llm'
import type { DreamRecord } from '../types/dream'

export function MorningPage() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [pendingDream, setPendingDream] = useState<DreamRecord | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSaved = useCallback(() => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  useAutoSave({ text, onSaved: handleSaved })

  const handleMicClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.lang = 'ja-JP'
        recognition.continuous = true
        recognition.interimResults = true

        recognition.onresult = (event: any) => {
          let transcript = ''
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript
          }
          setText(prev => prev + transcript)
        }

        recognition.start()
      }
    }
  }, [])

  const handleQuestionnaireComplete = useCallback(async (answers: Record<string, string[]>) => {
    // 自由入力とアンケート回答を合わせてトークン化
    const tokens: string[] = []

    // 自由入力があれば追加
    if (text.trim()) {
      tokens.push(...text.split('\n').filter(line => line.trim()))
    }

    // アンケート回答をトークンとして追加
    Object.entries(answers).forEach(([, values]) => {
      tokens.push(...values)
    })

    const dream: DreamRecord = {
      id: crypto.randomUUID(),
      tokens,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      analysisCount: 0,
    }

    await saveDream(dream)
    setPendingDream(dream)
    setShowQuestionnaire(false)
  }, [text])

  const handleConfirmAndAnalyze = useCallback(async () => {
    if (!pendingDream) return

    setAnalyzing(true)
    const content = pendingDream.tokens.join('\n')
    const result = await analyzeDream(
      pendingDream.id,
      content,
      0,
      undefined
    )

    if (result.success && result.analysis) {
      const updatedDream: DreamRecord = {
        ...pendingDream,
        analysisCount: result.newAnalysisCount,
        lastContentHash: result.contentHash,
        lastAnalysis: result.analysis,
        updatedAt: Date.now(),
      }
      await saveDream(updatedDream)
      setPendingDream(updatedDream)
    }
    setAnalyzing(false)
  }, [pendingDream])

  const handleDreamUpdate = useCallback((dream: DreamRecord) => {
    setPendingDream(dream)
  }, [])

  const handleFinish = useCallback(() => {
    setPendingDream(null)
    setText('')
  }, [])

  // 確定後のDreamDetail表示
  if (pendingDream) {
    return (
      <>
        <DreamDetail
          dream={pendingDream}
          onClose={handleFinish}
          onUpdate={handleDreamUpdate}
        />
        {analyzing && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--color-text-primary)',
            fontSize: '1.2rem',
            zIndex: 200,
          }}>
            分析中...
          </div>
        )}
      </>
    )
  }

  // アンケート表示
  if (showQuestionnaire) {
    return (
      <DreamQuestionnaire
        onComplete={handleQuestionnaireComplete}
        onCancel={() => setShowQuestionnaire(false)}
      />
    )
  }

  return (
    <>
      <DreamInput ref={inputRef} value={text} onChange={setText} />
      <MicButton onClick={handleMicClick} />
      {saved && <SaveIndicator />}

      {/* 構造化入力ボタン */}
      <button
        onClick={() => setShowQuestionnaire(true)}
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-lg)',
          left: 'var(--spacing-lg)',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'var(--color-text-muted)',
          padding: '10px 16px',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        質問形式で入力
      </button>

      {/* 確定ボタン（テキストがある場合） */}
      {text.trim() && (
        <button
          onClick={async () => {
            const tokens = text.split('\n').filter(line => line.trim())
            const dream: DreamRecord = {
              id: crypto.randomUUID(),
              tokens,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              analysisCount: 0,
            }
            await saveDream(dream)
            setPendingDream(dream)
            handleConfirmAndAnalyze()
          }}
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-lg)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(100, 150, 255, 0.3)',
            border: 'none',
            borderRadius: '12px',
            color: 'var(--color-text-primary)',
            padding: '14px 32px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          確定して分析
        </button>
      )}
    </>
  )
}

function SaveIndicator() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(var(--spacing-lg) + 40px)',
      right: 'var(--spacing-lg)',
      color: 'var(--color-text-muted)',
      fontSize: 'var(--font-size-small)',
    }}>
      saved
    </div>
  )
}
