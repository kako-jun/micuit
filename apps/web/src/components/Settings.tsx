import { getAllDreams } from '../lib/db'
import styles from './Settings.module.css'

export function Settings() {
  const handleExport = async () => {
    const dreams = await getAllDreams()
    const data = JSON.stringify(dreams, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yumicuit-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()
      try {
        const dreams = JSON.parse(text)
        // TODO: validate and import dreams
        console.log('Import:', dreams.length, 'dreams')
        alert(`${dreams.length}件の夢をインポートしました（実装中）`)
      } catch {
        alert('ファイルの読み込みに失敗しました')
      }
    }
    input.click()
  }

  return (
    <div className={styles.container}>
      <div className={styles.group}>
        <label className={styles.label}>データ管理</label>
        <div className={styles.buttons}>
          <button className={styles.button} onClick={handleExport}>
            エクスポート
          </button>
          <button className={styles.button} onClick={handleImport}>
            インポート
          </button>
        </div>
      </div>
    </div>
  )
}
