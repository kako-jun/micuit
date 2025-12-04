import type { DreamRecord } from '../types/dream'

const DB_NAME = 'yumicuit'
const DB_VERSION = 2
const STORE_NAME = 'dreams'
const STOCK_STORE_NAME = 'dreamStock'

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance)
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(STOCK_STORE_NAME)) {
        db.createObjectStore(STOCK_STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function saveDream(dream: DreamRecord): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(dream)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getDream(id: string): Promise<DreamRecord | undefined> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function getAllDreams(): Promise<DreamRecord[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('createdAt')
    const request = index.openCursor(null, 'prev')

    const results: DreamRecord[] = []

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        results.push(cursor.value)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
  })
}

// Dream Stock (また見たい夢)
export async function addToStock(dream: DreamRecord): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STOCK_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STOCK_STORE_NAME)
    const request = store.put(dream)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function removeFromStock(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STOCK_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STOCK_STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getStockedDreams(): Promise<DreamRecord[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STOCK_STORE_NAME, 'readonly')
    const store = transaction.objectStore(STOCK_STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function isInStock(id: string): Promise<boolean> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STOCK_STORE_NAME, 'readonly')
    const store = transaction.objectStore(STOCK_STORE_NAME)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(!!request.result)
  })
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
