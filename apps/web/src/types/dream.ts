export interface DreamImage {
  id: string
  data: string                 // Base64エンコードされた画像
  source: 'user' | 'ai'        // ユーザーアップロード or AI生成
  createdAt: number
}

export interface DreamRecord {
  id: string
  tokens: string[]
  createdAt: number
  updatedAt: number
  // AI分析関連
  analysisCount?: number       // 分析した回数（最大3）
  lastContentHash?: string     // 最後に分析した時の内容ハッシュ
  lastAnalysis?: string        // 最後の分析結果
  // 画像関連
  images?: DreamImage[]        // 関連画像（ユーザーアップロード or AI生成）
}
