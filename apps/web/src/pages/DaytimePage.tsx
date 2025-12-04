import { DreamList } from '../components/DreamList'
import { Settings } from '../components/Settings'
import styles from './DaytimePage.module.css'

export function DaytimePage() {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h1 className={styles.title}>yumicuit</h1>
        <p className={styles.description}>
          夢を記録し、AIと対話し、次の夢をデザインする
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>過去の夢</h2>
        <DreamList />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>使い方</h2>
        <div className={styles.modes}>
          <div className={styles.mode}>
            <span className={styles.modeLabel}>朝</span>
            <p>目覚めたらすぐ夢を記録。最小限のUIで覚醒を妨げない。</p>
          </div>
          <div className={styles.mode}>
            <span className={styles.modeLabel}>昼</span>
            <p>記録した夢を振り返り、AIと対話して解釈を深める。</p>
          </div>
          <div className={styles.mode}>
            <span className={styles.modeLabel}>夜</span>
            <p>見たい夢のイメージを準備。プライミングで夢をデザイン。</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>設定</h2>
        <Settings />
      </section>
    </div>
  )
}
