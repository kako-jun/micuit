import { useState } from 'react'
import styles from './DreamQuestionnaire.module.css'

interface Question {
  id: string
  text: string
  options: string[]
}

const QUESTIONS: Question[] = [
  {
    id: 'place',
    text: 'どこにいた？',
    options: ['家', '学校', '職場', '外', '知らない場所', '空', '海', '山'],
  },
  {
    id: 'people',
    text: '誰がいた？',
    options: ['自分だけ', '家族', '友人', '恋人', '知らない人', '有名人', '動物'],
  },
  {
    id: 'action',
    text: '何をしていた？',
    options: ['歩く', '走る', '飛ぶ', '話す', '見てる', '逃げる', '探す', '食べる'],
  },
  {
    id: 'feeling',
    text: 'どんな気分だった？',
    options: ['楽しい', '怖い', '悲しい', '不思議', '懐かしい', '焦る', '安心'],
  },
  {
    id: 'object',
    text: '印象的だったものは？',
    options: ['乗り物', '食べ物', '水', '火', '光', '闇', '鏡', '扉'],
  },
]

interface DreamQuestionnaireProps {
  onComplete: (answers: Record<string, string[]>) => void
  onCancel: () => void
}

export function DreamQuestionnaire({ onComplete, onCancel }: DreamQuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const currentQuestion = QUESTIONS[currentIndex]
  const isLastQuestion = currentIndex === QUESTIONS.length - 1
  const currentAnswers = answers[currentQuestion.id] || []

  const handleSelect = (option: string) => {
    setAnswers(prev => {
      const current = prev[currentQuestion.id] || []
      if (current.includes(option)) {
        return { ...prev, [currentQuestion.id]: current.filter(o => o !== option) }
      }
      return { ...prev, [currentQuestion.id]: [...current, option] }
    })
  }

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: [...(prev[currentQuestion.id] || []), customInput.trim()],
      }))
      setCustomInput('')
      setShowCustom(false)
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(answers)
    } else {
      setCurrentIndex(prev => prev + 1)
      setShowCustom(false)
      setCustomInput('')
    }
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setShowCustom(false)
      setCustomInput('')
    }
  }

  const handleSkip = () => {
    if (isLastQuestion) {
      onComplete(answers)
    } else {
      setCurrentIndex(prev => prev + 1)
      setShowCustom(false)
      setCustomInput('')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.progress}>
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i === currentIndex ? styles.active : ''} ${i < currentIndex ? styles.done : ''}`}
          />
        ))}
      </div>

      <h2 className={styles.question}>{currentQuestion.text}</h2>

      <div className={styles.options}>
        {currentQuestion.options.map(option => (
          <button
            key={option}
            className={`${styles.option} ${currentAnswers.includes(option) ? styles.selected : ''}`}
            onClick={() => handleSelect(option)}
          >
            {option}
          </button>
        ))}
        <button
          className={`${styles.option} ${styles.other}`}
          onClick={() => setShowCustom(true)}
        >
          その他...
        </button>
      </div>

      {showCustom && (
        <div className={styles.customInput}>
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            placeholder="自由入力"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
          />
          <button onClick={handleCustomSubmit}>追加</button>
        </div>
      )}

      {currentAnswers.length > 0 && (
        <div className={styles.selected_list}>
          {currentAnswers.map(answer => (
            <span key={answer} className={styles.tag}>
              {answer}
              <button onClick={() => handleSelect(answer)}>×</button>
            </span>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.cancel} onClick={onCancel}>
          やめる
        </button>
        <div className={styles.nav}>
          {currentIndex > 0 && (
            <button className={styles.back} onClick={handleBack}>
              戻る
            </button>
          )}
          <button className={styles.skip} onClick={handleSkip}>
            スキップ
          </button>
          <button className={styles.next} onClick={handleNext}>
            {isLastQuestion ? '完了' : '次へ'}
          </button>
        </div>
      </div>
    </div>
  )
}
