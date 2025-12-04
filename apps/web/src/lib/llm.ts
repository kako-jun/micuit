// Cloudflare Workers AI 経由でLLM呼び出し

const API_URL = import.meta.env.VITE_API_URL || 'https://yumicuit-api.your-subdomain.workers.dev';

interface AnalyzeResponse {
  success: boolean;
  analysis?: string;
  newAnalysisCount?: number;
  contentHash?: string;
  error?: string;
  message?: string;
}

// シンプルなハッシュ関数
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function analyzeDream(
  dreamId: string,
  content: string,
  analysisCount: number,
  lastContentHash?: string
): Promise<AnalyzeResponse> {
  const contentHash = hashContent(content);

  // 同じ内容での再分析をクライアント側でもブロック
  if (lastContentHash && contentHash === lastContentHash) {
    return {
      success: false,
      error: 'same_content',
      message: '内容が変わっていません。編集してから再分析してください。',
    };
  }

  // 回数制限をクライアント側でもチェック
  if (analysisCount >= 3) {
    return {
      success: false,
      error: 'analysis_limit',
      message: '分析回数の上限（3回）に達しました。自分で編集してください。',
    };
  }

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dreamId,
        content,
        contentHash,
        analysisCount,
        lastContentHash,
      }),
    });

    const data: AnalyzeResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'unknown',
        message: data.message || 'エラーが発生しました',
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: 'network_error',
      message: 'ネットワークエラー。接続を確認してください。',
    };
  }
}
