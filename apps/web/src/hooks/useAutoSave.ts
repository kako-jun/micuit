import { useEffect, useRef, useCallback } from 'react'
import { saveDream, generateId } from '../lib/db'
import type { DreamRecord } from '../types/dream'

const AUTO_SAVE_DELAY = 3000 // 3 seconds of inactivity

interface UseAutoSaveOptions {
  text: string
  onSaved?: () => void
}

export function useAutoSave({ text, onSaved }: UseAutoSaveOptions) {
  const dreamIdRef = useRef<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const lastSavedTextRef = useRef<string>('')

  const save = useCallback(async () => {
    const trimmedText = text.trim()

    // Don't save if empty or unchanged
    if (!trimmedText || trimmedText === lastSavedTextRef.current) {
      return
    }

    // Create new dream ID if first save
    if (!dreamIdRef.current) {
      dreamIdRef.current = generateId()
    }

    const tokens = trimmedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const now = Date.now()
    const dream: DreamRecord = {
      id: dreamIdRef.current,
      tokens,
      createdAt: now,
      updatedAt: now,
    }

    await saveDream(dream)
    lastSavedTextRef.current = trimmedText
    onSaved?.()
  }, [text, onSaved])

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Skip if text is empty
    if (!text.trim()) {
      return
    }

    // Set new timer
    timerRef.current = window.setTimeout(() => {
      save()
    }, AUTO_SAVE_DELAY)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [text, save])

  // Save on unmount if there's unsaved content
  useEffect(() => {
    return () => {
      if (text.trim() && text.trim() !== lastSavedTextRef.current) {
        save()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { save }
}
